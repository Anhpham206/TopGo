import subprocess
import sys

def run(cmd):
    print(f"Running: {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    print("STDERR:", res.stderr)
    print("RETURN_CODE:", res.returncode)

if __name__ == "__main__":
    cmd = sys.argv[1]
    run(cmd)
