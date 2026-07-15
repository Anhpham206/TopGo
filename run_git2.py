import subprocess
import os

def run(cmd):
    print(f"Running: {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)
    print("RETURN_CODE:", res.returncode)
    print("-" * 40)
    return res.returncode

def main():
    try:
        os.remove("status.txt")
    except:
        pass

    # Create and switch to new branch
    run("git checkout -b kien-social-update")
    
    # Add all files except our scripts
    run("git add .")
    run("git reset run_git.py")
    run("git reset run_git2.py")
    
    # Commit changes
    run("git commit -m \"Feature: social update and feed improvements\"")
    
    # Fetch origin
    run("git fetch origin")
    
    # Merge origin/main to ensure it's mergeable
    print("Attempting to merge origin/main...")
    merge_res = run("git merge origin/main --no-edit")
    
    if merge_res != 0:
        print("MERGE FAILED. Aborting merge...")
        run("git merge --abort")
    else:
        print("Merge successful (or already up to date). Pushing to origin...")
        push_res = run("git push -u origin kien-social-update")
        if push_res != 0:
            print("Failed to push to origin.")

if __name__ == "__main__":
    main()
