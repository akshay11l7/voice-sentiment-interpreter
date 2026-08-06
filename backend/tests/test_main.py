import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import io

from app.main import app
from app.database import get_db, Base

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_register_success():
    response = client.post(
        "/api/register",
        json={"email": "test@example.com", "password": "password123", "full_name": "Test User"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
    assert "id" in response.json()


def test_register_duplicate():
    # Attempt to register the same user again
    response = client.post(
        "/api/register",
        json={"email": "test@example.com", "password": "password123", "full_name": "Test User"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


def test_login_success():
    response = client.post(
        "/api/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"


def test_login_invalid():
    response = client.post(
        "/api/login",
        data={"username": "test@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_get_me():
    # Login first
    login_response = client.post(
        "/api/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    response = client.get(
        "/api/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


def test_get_interactions():
    login_response = client.post(
        "/api/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    response = client.get(
        "/api/interactions",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_delete_interaction_unauthorized():
    # Attempt to delete without a token
    response = client.delete("/api/interactions/999")
    assert response.status_code == 401

    # Attempt to delete with a token but non-existent interaction
    login_response = client.post(
        "/api/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    response2 = client.delete(
        "/api/interactions/999",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response2.status_code == 404
    assert response2.json()["detail"] == "Interaction not found or you don't have permission to delete it"


def test_get_audit_logs():
    login_response = client.post(
        "/api/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    response = client.get(
        "/api/logs",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
    assert len(logs) > 0  # Should have logs from registration and logins


def test_upload_invalid_format():
    login_response = client.post(
        "/api/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    # Send a text file instead of an audio file
    file_content = b"this is not a valid audio file"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    
    response = client.post(
        "/api/upload",
        headers={"Authorization": f"Bearer {token}"},
        files=files
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_upload_missing_file():
    login_response = client.post(
        "/api/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    response = client.post(
        "/api/upload",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 422 # Unprocessable Entity due to missing field
