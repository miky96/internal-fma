# Build the React app (Vite)
build:
	npm ci --legacy-peer-deps
	npm run build

# Deploy to Firebase Hosting (requires you to be logged in with Firebase CLI)
deploy: build
	firebase deploy --only hosting

# Local dev server
dev:
	npm run dev

# Local preview of the production build
preview:
	npm run preview

# Clean node_modules and build outputs
clean:
	rm -rf node_modules dist build

.PHONY: build deploy dev preview clean
