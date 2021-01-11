const endpoints = require('../endpoints');


test(
	'test add endpoint pattern',
	() => {
		const { pattern, handler } = endpoints.handlers.add;

		const shouldMatch = [
			'add movie',
			'Add movie',
			'AdD very long movie name with too many words',
		];

		const shouldNotMatch = [
			'addmovie',
			'Addmovie',
			' Add with leading space',
			'ad movie',
			'addd movie',
		];

		for (let input of shouldMatch) {
			expect(pattern.test(input)).toBeTruthy();
		}

		for (let input of shouldNotMatch) {
			expect(pattern.test(input)).toBeFalsy();
		}
	}
);
