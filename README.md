# DentalKitten
Dental kitten helps plan for your daily dental schedule

## Run

### Windows

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py                   # http://127.0.0.1:5000
```

### macOS

Install Python first if you don't have it (check with `python3 --version`):

```bash
# Install Homebrew (skip if `brew --version` already works)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python
brew install python
```

Then set up and run the app. On macOS use `python3` / `pip3` (plain `python` may not exist):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # inside the venv, pip = pip3
python app.py                    # http://127.0.0.1:5000
```

> If `pip3 install` outside a venv gives an "externally-managed-environment" error, activate the venv first.
>
> On macOS, port 5000 may already be used by AirPlay Receiver. If the app won't start, turn it off in System Settings → General → AirDrop & Handoff.
