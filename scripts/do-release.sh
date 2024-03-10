#!/bin/bash


echo "Have you updated CHANGELOG.md, versions.json, manifest.json and package.json?"
read -p "Press any key to continue, or press Ctrl+C to cancel."


last_tag=$(git describe --tags --abbrev=0)
echo "Last tag: $last_tag"
# Prompt the user for a version number
read -p "Enter the version number: " version_number

# Tag the last git commit with the provided version number
git tag -a "$version_number" -m "$version_number"

# Push the tagged commit to the remote repository
git push origin "$version_number"

echo "Tagged and pushed commit with version $version_number successfully."
