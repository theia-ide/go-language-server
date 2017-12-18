export function mockError() {
	throw new Error('Mock should never be called');
}

export function mockFunction(...args: any[]): any {
	mockError();
}