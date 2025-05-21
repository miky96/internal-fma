# Build the React app
build:
	npm ci
	npm run build

# Deploy to Firebase Hosting (requires you to be logged in with Firebase CLI)
deploy: build
	firebase deploy --only hosting

# Preview locally (optional)
serve:
	firebase serve --only hosting

# Clean node_modules and build (optional)
clean:
	rm -rf node_modules build

.PHONY: build deploy serve clean