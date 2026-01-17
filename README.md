# My Web App

A FastAPI web application.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# On macOS/Linux
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

Start the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Interactive API docs (Swagger UI): `http://localhost:8000/docs`
- Alternative API docs (ReDoc): `http://localhost:8000/redoc`

## Available Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint
- `GET /api/hello/{name}` - Greet a user by name

## Project Structure

```
my-web-app/
├── app/
│   └── main.py          # Main application file
├── requirements.txt      # Python dependencies
└── README.md            # This file
```
