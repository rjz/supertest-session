#!/bin/bash

set -e

# Override main branch
# ONLY changes to this branch will be reported back to coveralls after a
# successful test run.
MASTER_BRANCH=master

[[ "$TRAVIS_PULL_REQUEST" == 'false' && "$TRAVIS_BRANCH" == $MASTER_BRANCH ]] || {
  echo "Skipping post-build tasks for pull request"
  exit 0;
}

cat coverage/lcov.info | coveralls

