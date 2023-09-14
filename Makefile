test:
	npm run lint
	npm run test:unit

pub-%:
	npm publish --workspace @kelchy/$*
