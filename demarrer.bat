@echo off
cd /d "%~dp0"
if not exist .venv (
  echo Installation, une seule fois...
  python -m venv .venv
  .venv\Scripts\pip install -r requirements.txt
)
.venv\Scripts\python camera.py
pause
