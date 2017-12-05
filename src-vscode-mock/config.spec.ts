import { expect } from 'chai';
import { DefaultConfig } from './config';

describe('default config', () => {
	it('read property', () => {
		const config = DefaultConfig.instance
		const property: string = config.get('buildOnSave')
		expect(property).to.equal('package')
	})
})