import os
import sys

# Ensure both project root and backend dir are in python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_dir = os.path.dirname(backend_dir)

for path in (root_dir, backend_dir):
    if path not in sys.path:
        sys.path.insert(0, path)
