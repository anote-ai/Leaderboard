from __future__ import annotations

import time

try:
    import app as app_module
except ImportError:
    import backend.app as app_module  # type: ignore


app = app_module.app


def reset_store() -> None:
    app_module._STORE["submissions"].clear()
    app_module._STORE["evaluations"].clear()
    app_module._STORE["datasets"].clear()
    app_module._STORE.setdefault("submission_counts", {}).clear()
    app_module.LEADERBOARD_DATA.clear()
    app_module._AUTO_SEED_DONE = False


def make_jwt(sub: str) -> str:
    import jwt as pyjwt

    return pyjwt.encode({"sub": sub}, "dev-secret", algorithm="HS256")


def auth_headers(sub: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_jwt(sub)}"}


def seed_classification_dataset(name: str = "workflow_classification") -> None:
    app_module._STORE["datasets"].append({
        "name": name,
        "task_type": "text_classification",
        "evaluation_metric": "accuracy",
        "reference_data": {
            "source_texts": ["great", "bad"],
            "labels": ["positive", "negative"],
            "label_names": ["positive", "negative"],
        },
    })


def test_async_submit_job_completes_and_is_owner_scoped(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    seed_classification_dataset()

    with app.test_client() as c:
        response = c.post("/public/submit_model", json={
            "benchmarkDatasetName": "workflow_classification",
            "modelName": "async-model",
            "modelResults": ["positive", "negative"],
            "sentence_ids": [0, 1],
            "async": True,
        }, headers=auth_headers("async-owner"))
        assert response.status_code == 202
        job_id = response.get_json()["job_id"]

        other_user = c.get(f"/public/eval_jobs/{job_id}", headers=auth_headers("other-user"))
        assert other_user.status_code == 404

        final_body = None
        for _ in range(40):
            poll = c.get(f"/public/eval_jobs/{job_id}", headers=auth_headers("async-owner"))
            assert poll.status_code == 200
            final_body = poll.get_json()
            if final_body["status"] == "completed":
                break
            time.sleep(0.05)

        assert final_body["status"] == "completed"
        assert final_body["success"] is True
        assert final_body["score"] == 1.0
        assert final_body["submission_id"] >= 1


def test_my_submissions_rejects_malformed_cursor_without_crashing(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_API_KEYS", "workflow-key")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()

    with app.test_client() as c:
        response = c.get(
            "/public/my_submissions?submitter_id=user-one&cursor=not-a-valid-cursor",
            headers={"X-API-Key": "workflow-key"},
        )

    assert response.status_code == 400
    body = response.get_json()
    assert body["success"] is False
    assert body["error"] == "Invalid cursor"


def test_private_submission_detail_requires_owner(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    seed_classification_dataset()

    with app.test_client() as c:
        submitted = c.post("/public/submit_model", json={
            "benchmarkDatasetName": "workflow_classification",
            "modelName": "private-model",
            "modelResults": ["positive", "negative"],
            "sentence_ids": [0, 1],
            "is_public": False,
        }, headers=auth_headers("private-owner"))
        assert submitted.status_code == 200
        submission_id = submitted.get_json()["submission_id"]

        anonymous = c.get(f"/public/submissions/{submission_id}")
        assert anonymous.status_code == 401

        other_user = c.get(f"/public/submissions/{submission_id}", headers=auth_headers("other-user"))
        assert other_user.status_code == 403

        owner = c.get(f"/public/submissions/{submission_id}", headers=auth_headers("private-owner"))
        assert owner.status_code == 200
        body = owner.get_json()
        assert body["success"] is True
        assert body["submission"]["model_results"] == ["positive", "negative"]


def test_my_submissions_memory_response_includes_visibility(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    seed_classification_dataset()

    with app.test_client() as c:
        submitted = c.post("/public/submit_model", json={
            "benchmarkDatasetName": "workflow_classification",
            "modelName": "private-row",
            "modelResults": ["positive", "negative"],
            "sentence_ids": [0, 1],
            "is_public": False,
        }, headers=auth_headers("row-owner"))
        assert submitted.status_code == 200

        mine = c.get("/public/my_submissions", headers=auth_headers("row-owner"))
        assert mine.status_code == 200
        rows = mine.get_json()["submissions"]
        assert rows[0]["model_name"] == "private-row"
        assert rows[0]["is_public"] is False


def test_submission_format_exposes_allowed_outputs_without_answers(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    app_module._STORE["datasets"].append({
        "name": "workflow_mcq",
        "task_type": "multiple_choice_qa",
        "evaluation_metric": "accuracy",
        "reference_data": {
            "ground_truth": [
                {"id": 0, "question": "Pick one", "options": {"A": "Alpha", "B": "Beta"}, "answer": "B"},
            ],
        },
    })

    with app.test_client() as c:
        response = c.get("/public/submission_format?dataset=workflow_mcq")

    assert response.status_code == 200
    body = response.get_json()
    assert body["task_type_normalized"] == "multiple_choice_qa"
    assert body["allowed_outputs"] == ["A", "B"]
    assert body["submit_model_body"]["modelResults"] == ["A"]


def test_run_llm_submission_validates_dataset_and_provider_failure(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.delenv("REQUIRE_API_KEY", raising=False)
    monkeypatch.delenv("LEADERBOARD_API_KEYS", raising=False)
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    seed_classification_dataset("llm_workflow")

    with app.test_client() as c:
        missing = c.post("/public/run_llm_submission", json={
            "benchmarkDatasetName": "missing",
            "modelName": "llm",
            "provider": "not-a-provider",
        })
        assert missing.status_code == 404

        bad_provider = c.post("/public/run_llm_submission", json={
            "benchmarkDatasetName": "llm_workflow",
            "modelName": "llm",
            "provider": "not-a-provider",
            "batch_size": 1,
        })
        assert bad_provider.status_code == 202
        job_id = bad_provider.get_json()["job_id"]
        final_body = None
        for _ in range(40):
            poll = c.get(f"/public/eval_jobs/{job_id}")
            assert poll.status_code == 200
            final_body = poll.get_json()
            if final_body["status"] == "failed":
                break
            time.sleep(0.05)
        assert final_body["status"] == "failed"
        assert "Unknown provider" in final_body["error"]


def test_beaten_notification_fires_when_champion_is_displaced(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    seed_classification_dataset("beaten_ds")

    beaten_calls: list[dict] = []

    try:
        import email_notifications
    except ImportError:
        import backend.email_notifications as email_notifications  # type: ignore

    monkeypatch.setattr(
        email_notifications,
        "send_beaten_notification",
        lambda to, **kw: beaten_calls.append({"to": to, **kw}),
    )

    with app.test_client() as c:
        # First submitter becomes champion
        r1 = c.post("/public/submit_model", json={
            "benchmarkDatasetName": "beaten_ds",
            "modelName": "champ-model",
            "modelResults": ["positive", "negative"],
            "sentence_ids": [0, 1],
            "submittedBy": "champion@example.com",
            "is_public": True,
        }, headers=auth_headers("champ"))
        assert r1.status_code == 200
        assert len(beaten_calls) == 0  # no one to notify yet

        # Second submitter beats the champion with a perfect score (same labels)
        r2 = c.post("/public/submit_model", json={
            "benchmarkDatasetName": "beaten_ds",
            "modelName": "challenger-model",
            "modelResults": ["positive", "negative"],
            "sentence_ids": [0, 1],
            "submittedBy": "challenger@example.com",
            "is_public": True,
        }, headers=auth_headers("challenger"))
        assert r2.status_code == 200

    # Both submissions score 1.0 (accuracy); challenger ties/beats champion — notification fires
    # when new_score > prev_score strictly, so we need a strict improvement.
    # Re-run with only one correct to set champion below 1.0 first.
    reset_store()
    beaten_calls.clear()
    app_module._STORE["datasets"].append({
        "name": "beaten_ds2",
        "task_type": "text_classification",
        "evaluation_metric": "accuracy",
        "reference_data": {
            "source_texts": ["great", "bad", "ok"],
            "labels": ["positive", "negative", "neutral"],
            "label_names": ["positive", "negative", "neutral"],
        },
    })

    with app.test_client() as c:
        # Champion scores 1/3 ≈ 0.333
        c.post("/public/submit_model", json={
            "benchmarkDatasetName": "beaten_ds2",
            "modelName": "weak-champ",
            "modelResults": ["positive", "positive", "positive"],
            "sentence_ids": [0, 1, 2],
            "submittedBy": "weak@example.com",
            "is_public": True,
        }, headers=auth_headers("weak-champ"))
        assert len(beaten_calls) == 0

        # Challenger scores 3/3 = 1.0 — displaces the champion
        c.post("/public/submit_model", json={
            "benchmarkDatasetName": "beaten_ds2",
            "modelName": "strong-challenger",
            "modelResults": ["positive", "negative", "neutral"],
            "sentence_ids": [0, 1, 2],
            "submittedBy": "strong@example.com",
            "is_public": True,
        }, headers=auth_headers("strong-challenger"))

    assert len(beaten_calls) == 1
    call = beaten_calls[0]
    assert call["to"] == "weak@example.com"
    assert call["your_model"] == "weak-champ"
    assert call["new_model"] == "strong-challenger"
    assert call["new_score"] > call["your_score"]
    assert call["dataset_name"] == "beaten_ds2"


def test_watch_subscribe_unsubscribe_roundtrip(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()

    with app.test_client() as c:
        # Subscribe
        r = c.post("/public/datasets/my-dataset/watch", json={
            "email": "watcher@example.com",
            "watch_type": "beaten",
        })
        assert r.status_code == 200
        assert r.get_json()["success"] is True

        # Status shows watching
        s = c.get("/public/datasets/my-dataset/watch?email=watcher@example.com")
        assert s.status_code == 200
        body = s.get_json()
        assert body["watching"] is True
        assert body["watch_type"] == "beaten"

        # Unsubscribe by email
        u = c.delete("/public/datasets/my-dataset/watch", json={"email": "watcher@example.com"})
        assert u.status_code == 200

        # Status shows not watching
        s2 = c.get("/public/datasets/my-dataset/watch?email=watcher@example.com")
        assert s2.get_json()["watching"] is False


def test_watch_token_unsubscribe_page(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()

    with app.test_client() as c:
        c.post("/public/datasets/tok-ds/watch", json={
            "email": "tok@example.com", "watch_type": "top5"
        })
        token = next(
            w["token"] for w in app_module._STORE["watches"]
            if w["email"] == "tok@example.com"
        )

        page = c.get(f"/public/watch/unsubscribe?token={token}")
        assert page.status_code == 200
        assert b"unsubscribed" in page.data.lower()

        # Second click: already unsubscribed
        page2 = c.get(f"/public/watch/unsubscribe?token={token}")
        assert page2.status_code == 200
        assert b"already" in page2.data.lower()


def test_watchers_receive_beaten_notification(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    app_module._STORE["datasets"].append({
        "name": "watcher_ds",
        "task_type": "text_classification",
        "evaluation_metric": "accuracy",
        "reference_data": {
            "source_texts": ["great", "bad", "ok"],
            "labels": ["positive", "negative", "neutral"],
            "label_names": ["positive", "negative", "neutral"],
        },
    })

    beaten_calls: list[dict] = []

    try:
        import email_notifications
    except ImportError:
        import backend.email_notifications as email_notifications  # type: ignore

    monkeypatch.setattr(
        email_notifications,
        "send_beaten_notification",
        lambda to, **kw: beaten_calls.append({"to": to, **kw}),
    )

    with app.test_client() as c:
        # A third party watches the dataset (not a submitter)
        c.post("/public/datasets/watcher_ds/watch", json={
            "email": "bystander@example.com", "watch_type": "beaten"
        })

        # Weak champion
        c.post("/public/submit_model", json={
            "benchmarkDatasetName": "watcher_ds",
            "modelName": "champ",
            "modelResults": ["positive", "positive", "positive"],
            "sentence_ids": [0, 1, 2],
            "submittedBy": "champ@example.com",
            "is_public": True,
        }, headers=auth_headers("champ"))
        assert len(beaten_calls) == 0

        # Challenger beats champion
        c.post("/public/submit_model", json={
            "benchmarkDatasetName": "watcher_ds",
            "modelName": "challenger",
            "modelResults": ["positive", "negative", "neutral"],
            "sentence_ids": [0, 1, 2],
            "submittedBy": "challenger@example.com",
            "is_public": True,
        }, headers=auth_headers("challenger"))

    # champion + bystander should both receive notifications
    recipients = {call["to"] for call in beaten_calls}
    assert "champ@example.com" in recipients
    assert "bystander@example.com" in recipients
    # challenger should NOT be notified (they are the new #1)
    assert "challenger@example.com" not in recipients
    # Both emails carry the dataset name
    for call in beaten_calls:
        assert call["dataset_name"] == "watcher_ds"


def test_beaten_notification_not_sent_for_self_improvement(monkeypatch):
    monkeypatch.setenv("DISABLE_RATE_LIMIT", "1")
    monkeypatch.setenv("LEADERBOARD_JWT_SECRET", "dev-secret")
    monkeypatch.setattr(app_module, "get_db_connection", lambda: (None, None))
    reset_store()
    app_module._STORE["datasets"].append({
        "name": "self_improve_ds",
        "task_type": "text_classification",
        "evaluation_metric": "accuracy",
        "reference_data": {
            "source_texts": ["great", "bad", "ok"],
            "labels": ["positive", "negative", "neutral"],
            "label_names": ["positive", "negative", "neutral"],
        },
    })

    beaten_calls: list[dict] = []

    try:
        import email_notifications
    except ImportError:
        import backend.email_notifications as email_notifications  # type: ignore

    monkeypatch.setattr(
        email_notifications,
        "send_beaten_notification",
        lambda to, **kw: beaten_calls.append({"to": to, **kw}),
    )

    with app.test_client() as c:
        # Same submitter improves their own score — no self-notification
        c.post("/public/submit_model", json={
            "benchmarkDatasetName": "self_improve_ds",
            "modelName": "v1",
            "modelResults": ["positive", "positive", "positive"],
            "sentence_ids": [0, 1, 2],
            "submittedBy": "self@example.com",
            "is_public": True,
        }, headers=auth_headers("self-user"))
        c.post("/public/submit_model", json={
            "benchmarkDatasetName": "self_improve_ds",
            "modelName": "v2",
            "modelResults": ["positive", "negative", "neutral"],
            "sentence_ids": [0, 1, 2],
            "submittedBy": "self@example.com",
            "is_public": True,
        }, headers=auth_headers("self-user"))

    assert len(beaten_calls) == 0
