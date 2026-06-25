"""Dataset watch/subscribe endpoints.

Subscribers receive email notifications when ranking changes match their
watch_type:
  beaten  — notify when any model beats the current #1 (default)
  top5    — notify whenever the top-5 composition changes

A token-based unsubscribe link is included in every notification email.
"""
import secrets
from flask import Blueprint, Response, current_app, request, jsonify

from shared import *

bp = Blueprint("watches", __name__)


# ── DB helpers ────────────────────────────────────────────────────────────────

def _ensure_watches_table(cursor, conn) -> None:
    cursor.execute(
        "CREATE TABLE IF NOT EXISTS dataset_watches ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "dataset_name VARCHAR(255) NOT NULL, "
        "email VARCHAR(255) NOT NULL, "
        "watch_type VARCHAR(50) NOT NULL DEFAULT 'beaten', "
        "token VARCHAR(64) NOT NULL, "
        "active INTEGER NOT NULL DEFAULT 1, "
        "created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "
        "UNIQUE(dataset_name, email)"
        ")"
    )
    conn.commit()


# ── Routes ────────────────────────────────────────────────────────────────────

@bp.post("/public/datasets/<path:dataset_name>/watch")
@rate_limit("ADD_DATASET_RATE_LIMIT", "5/minute")
def watch_dataset(dataset_name: str):
    """Subscribe an email address to ranking-change alerts for a dataset.

    Body: {"email": "user@example.com", "watch_type": "beaten"|"top5"}
    """
    data = request.get_json(silent=True) or {}
    try:
        email = validate_text(data.get("email"), "email", 255)
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    if "@" not in email:
        return jsonify({"success": False, "error": "email must be a valid address"}), 400

    watch_type = str(data.get("watch_type") or "beaten").lower().strip()
    if watch_type not in ("beaten", "top5"):
        return jsonify({"success": False, "error": "watch_type must be beaten or top5"}), 400

    token = secrets.token_urlsafe(32)

    conn, cursor = get_db_connection()
    if conn and cursor:
        try:
            _ensure_watches_table(cursor, conn)
            try:
                cursor.execute(
                    "INSERT INTO dataset_watches (dataset_name, email, watch_type, token, active) "
                    "VALUES (%s, %s, %s, %s, 1)",
                    (dataset_name, email, watch_type, token),
                )
                conn.commit()
            except Exception as ins_err:
                err_s = str(ins_err).lower()
                if "unique" in err_s or "duplicate" in err_s:
                    # Already watching — reactivate and update watch_type
                    cursor.execute(
                        "UPDATE dataset_watches SET watch_type=%s, token=%s, active=1 "
                        "WHERE dataset_name=%s AND email=%s",
                        (watch_type, token, dataset_name, email),
                    )
                    conn.commit()
                    cursor.execute(
                        "SELECT token FROM dataset_watches WHERE dataset_name=%s AND email=%s",
                        (dataset_name, email),
                    )
                    row = cursor.fetchone()
                    if row:
                        token = row["token"]
                else:
                    raise
        except Exception as e:
            logger.exception("watch_db_write_failed", extra={"error": str(e)})
            return jsonify({"success": False, "error": "Failed to save watch"}), 500
        finally:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass
    else:
        existing = next(
            (w for w in _STORE["watches"] if w["dataset_name"] == dataset_name and w["email"] == email),
            None,
        )
        if existing:
            existing["watch_type"] = watch_type
            existing["active"] = True
            token = existing["token"]
        else:
            watch_id = len(_STORE["watches"]) + 1
            _STORE["watches"].append({
                "id": watch_id,
                "dataset_name": dataset_name,
                "email": email,
                "watch_type": watch_type,
                "token": token,
                "active": True,
                "created": utc_now(),
            })

    logger.info("dataset_watched", extra={"dataset": dataset_name, "watch_type": watch_type})
    return jsonify({
        "success": True,
        "message": f"You'll be notified when the leaderboard changes on {dataset_name!r}.",
        "watch_type": watch_type,
    })


@bp.delete("/public/datasets/<path:dataset_name>/watch")
def unwatch_dataset(dataset_name: str):
    """Unsubscribe by email (body) or token (query param)."""
    token = (request.args.get("token") or "").strip()
    data = request.get_json(silent=True) or {}
    email = str(data.get("email") or "").strip()

    if not token and not email:
        return jsonify({"success": False, "error": "Provide token (query) or email (body)"}), 400

    conn, cursor = get_db_connection()
    if conn and cursor:
        try:
            _ensure_watches_table(cursor, conn)
            if token:
                cursor.execute(
                    "UPDATE dataset_watches SET active=0 WHERE dataset_name=%s AND token=%s",
                    (dataset_name, token),
                )
            else:
                cursor.execute(
                    "UPDATE dataset_watches SET active=0 WHERE dataset_name=%s AND email=%s",
                    (dataset_name, email),
                )
            conn.commit()
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
        finally:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass
    else:
        for w in _STORE["watches"]:
            if w["dataset_name"] != dataset_name:
                continue
            if (token and w["token"] == token) or (email and w["email"] == email):
                w["active"] = False

    return jsonify({"success": True, "message": "Unsubscribed."})


@bp.get("/public/watch/unsubscribe")
def unsubscribe_via_token():
    """One-click unsubscribe link used in notification emails.

    Returns a plain HTML confirmation page so clicking the link in an email
    immediately unsubscribes the user without a second confirmation step.
    """
    token = (request.args.get("token") or "").strip()
    if not token:
        return Response("<h2>Invalid unsubscribe link.</h2>", mimetype="text/html", status=400)

    found = False
    conn, cursor = get_db_connection()
    if conn and cursor:
        try:
            _ensure_watches_table(cursor, conn)
            cursor.execute(
                "UPDATE dataset_watches SET active=0 WHERE token=%s AND active=1",
                (token,),
            )
            conn.commit()
            found = (cursor.rowcount or 0) > 0
        except Exception:
            pass
        finally:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass
    else:
        for w in _STORE["watches"]:
            if w["token"] == token and w["active"]:
                w["active"] = False
                found = True

    frontend_url = os.getenv("LEADERBOARD_URL", "http://localhost:3000")
    if found:
        html = (
            "<!DOCTYPE html><html><head><meta charset='utf-8'>"
            "<style>body{font-family:sans-serif;background:#111827;color:#e5e7eb;"
            "display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}"
            ".box{max-width:400px;text-align:center;padding:2rem}"
            "h2{color:#fff}p{color:#9ca3af}a{color:#defe47}</style></head>"
            "<body><div class='box'>"
            "<h2>You've been unsubscribed.</h2>"
            "<p>You won't receive any more leaderboard alerts for this dataset.</p>"
            f"<p><a href='{frontend_url}'>Return to leaderboard</a></p>"
            "</div></body></html>"
        )
    else:
        html = (
            "<!DOCTYPE html><html><head><meta charset='utf-8'>"
            "<style>body{font-family:sans-serif;background:#111827;color:#e5e7eb;"
            "display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}"
            ".box{max-width:400px;text-align:center;padding:2rem}"
            "h2{color:#fff}p{color:#9ca3af}a{color:#defe47}</style></head>"
            "<body><div class='box'>"
            "<h2>Already unsubscribed.</h2>"
            "<p>This link has already been used or has expired.</p>"
            f"<p><a href='{frontend_url}'>Return to leaderboard</a></p>"
            "</div></body></html>"
        )
    return Response(html, mimetype="text/html")


@bp.get("/public/datasets/<path:dataset_name>/watch")
def watch_status(dataset_name: str):
    """Check whether an email is actively watching a dataset.

    Query param: email
    """
    email = (request.args.get("email") or "").strip()
    if not email or "@" not in email:
        return jsonify({"success": False, "error": "email query param required"}), 400

    conn, cursor = get_db_connection()
    if conn and cursor:
        try:
            _ensure_watches_table(cursor, conn)
            cursor.execute(
                "SELECT watch_type FROM dataset_watches "
                "WHERE dataset_name=%s AND email=%s AND active=1",
                (dataset_name, email),
            )
            row = cursor.fetchone()
            watching = row is not None
            watch_type = row["watch_type"] if row else None
        except Exception:
            watching = False
            watch_type = None
        finally:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass
    else:
        match = next(
            (w for w in _STORE["watches"] if w["dataset_name"] == dataset_name
             and w["email"] == email and w["active"]),
            None,
        )
        watching = match is not None
        watch_type = match["watch_type"] if match else None

    return jsonify({"success": True, "watching": watching, "watch_type": watch_type})


# ── Internal query used by submissions to fan-out notifications ───────────────

def get_active_watchers(dataset_name: str, watch_type: str) -> list[dict]:
    """Return [{email, token}] for active watchers of a given type on a dataset."""
    conn, cursor = get_db_connection()
    if conn and cursor:
        try:
            _ensure_watches_table(cursor, conn)
            cursor.execute(
                "SELECT email, token FROM dataset_watches "
                "WHERE dataset_name=%s AND watch_type=%s AND active=1",
                (dataset_name, watch_type),
            )
            rows = cursor.fetchall()
            return [{"email": r["email"], "token": r["token"]} for r in rows]
        except Exception:
            return []
        finally:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass
    return [
        {"email": w["email"], "token": w["token"]}
        for w in _STORE["watches"]
        if w["dataset_name"] == dataset_name and w["watch_type"] == watch_type and w["active"]
    ]
