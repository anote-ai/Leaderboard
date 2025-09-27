# Anote - Model Leaderboard

Anote's Model Leaderboard provides a way to benchmark and compare model performance. We have an API to:
1. **Adding new datasets** to the leaderboard across **all task types**.
2. **Adding new model submissions** to existing datasets.

The API is the backbone for a transparent, scalable, and community-driven benchmarking platform for AI models, supporting **text classification, named entity recognition, document-level Q&A (chatbot), and line-level Q&A (prompting)**.


### API Endpoints

#### `POST /api/leaderboard/add_dataset`
**Purpose**: Add a new benchmark dataset to the leaderboard.
**Input (JSON)**:
```json
{
  "name": "Financial Phrasebank - Classification Accuracy",
  "url": "https://huggingface.co/datasets/takala/financial_phrasebank",
  "task_type": "text_classification",
  "description": "A dataset for financial sentiment classification.",
  "models": [
    {
      "rank": 1,
      "model": "Gemini",
      "score": 0.95,
      "ci": "0.93 - 0.97",
      "updated": "Sep 2024"
    }
  ]
}
```
**Response**:
```json
{
  "status": "success",
  "message": "Dataset added to leaderboard.",
  "dataset_id": "uuid"
}
```

---

#### `POST /api/leaderboard/add_model`
**Purpose**: Add a new model submission to an existing dataset.
**Input (JSON)**:
```json
{
  "dataset_name": "Financial Phrasebank - Classification Accuracy",
  "model": "Llama3",
  "rank": 4,
  "score": 0.92,
  "ci": "0.90 - 0.94",
  "updated": "Sep 2024"
}
```
**Response**:
```json
{
  "status": "success",
  "message": "Model added to dataset on leaderboard."
}
```

---

### Supported Task Types
The API will support datasets across all current and future Anote task types:
- **Text Classification**
- **Named Entity Recognition**
- **Document-Level Q&A (Chatbot)**
- **Line-Level Q&A (Prompting)**
- *(Extensible for multimodal tasks and multilingual datasets)*

---

### 3. Example Code
Below is a **Flask implementation skeleton**:

```python
from flask import Flask, request, jsonify
import uuid

app = Flask(__name__)

leaderboard_data = []  # This would be replaced with a DB in production

@app.route('/api/leaderboard/add_dataset', methods=['POST'])
def add_dataset():
    data = request.json
    dataset_id = str(uuid.uuid4())
    data['id'] = dataset_id
    leaderboard_data.append(data)
    return jsonify({
        "status": "success",
        "message": "Dataset added to leaderboard.",
        "dataset_id": dataset_id
    })

@app.route('/api/leaderboard/add_model', methods=['POST'])
def add_model():
    data = request.json
    for dataset in leaderboard_data:
        if dataset['name'] == data['dataset_name']:
            dataset.setdefault('models', []).append({
                "rank": data["rank"],
                "model": data["model"],
                "score": data["score"],
                "ci": data["ci"],
                "updated": data["updated"]
            })
            return jsonify({
                "status": "success",
                "message": "Model added to dataset on leaderboard."
            })
    return jsonify({"status": "error", "message": "Dataset not found."}), 404

if __name__ == '__main__':
    app.run(debug=True)
```

---

### 4. Integration with Frontend
The API will integrate with:
- **Leaderboard Page** ([https://leaderboard.anote.ai/](https://leaderboard.anote.ai/))
- **Submit to Leaderboard Page** ([https://anote.ai/submittoleaderboard](https://leaderboard.anote.ai/submit))

This will allow direct testing of Flask API calls from the UI to verify real-time table updates.

## Contact
**Project Lead**: [Natan Vidra](malito:nvidra@anote.ai)
**Leaderboard**: [https://leaderboard.anote.ai/leaderboard](https://leaderboard.anote.ai/)
