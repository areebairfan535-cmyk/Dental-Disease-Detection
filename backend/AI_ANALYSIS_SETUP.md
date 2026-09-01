# Dental Image Analysis Setup

The backend no longer returns random dental results. `api/detection.php?action=analyze`
now requires one real analyzer:

## Option 1: OpenAI Vision

Create `backend/.env` and add:

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_VISION_MODEL=gpt-4.1-mini
```

Then restart PHP:

```powershell
php -S 0.0.0.0:8000 -t backend
```

The API will send the uploaded teeth image to the vision model and store the
structured result in SQLite.

## Option 2: Your Trained Dental Model

Run a Python/ML service that accepts:

```text
POST /predict
form-data: image=<file>
```

Return JSON like:

```json
{
  "diagnosis": "Cavity",
  "confidence": 0.88,
  "severity": "medium",
  "detected_issues": ["Possible cavity on molar"],
  "recommendations": ["Book a dentist appointment"],
  "tooth_positions": [16],
  "urgent_warning": null
}
```

Then start PHP with:

```powershell
$env:DENTAL_AI_URL="http://127.0.0.1:5000"
php -S 0.0.0.0:8000 -t backend
```

Important: image analysis is a screening aid, not a medical diagnosis. For
accurate clinical results, use a validated dental model and dentist review.
