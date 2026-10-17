"""Integration checks for the repository control plane, without executing artifact code."""
import re
import subprocess
import unittest


def command(*arguments):
    return subprocess.check_output(arguments, text=True).strip()


class BootstrapTests(unittest.TestCase):
    def test_repository_matches_canonical_git_origin(self):
        origin = command('git', 'remote', 'get-url', 'origin')
        match = re.search(r'github\.com[:/]([^/]+/[^/]+?)(?:\.git)?$', origin)
        self.assertIsNotNone(match, 'Expected a GitHub origin')
        configured = command('python3', '.bigbang/bin/bb.py', 'config', 'get', 'projeto.repositorio')
        self.assertEqual(configured, match.group(1), 'API mutations must use the canonical repository, without redirects')

    def test_generated_controls_match_configuration(self):
        completed = subprocess.run(['python3', '.bigbang/bin/bb.py', 'verify'], capture_output=True, text=True)
        self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)


if __name__ == '__main__':
    unittest.main()
