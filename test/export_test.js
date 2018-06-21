import chai from 'chai';

let should = chai.should();
let assert = chai.assert;

describe('Export Tests:', () => {
    beforeEach((done) => { //Before each test we empty the database
        //Nothing atm 
        //console.log("beforeEach ...");
        done();
    });

    describe('actually the first export Test', () => {
        it('it mocks a succesful test', (done) => {
            assert.equal(1, 1);
            done();
        });
    });
    describe('actually the second export Test', () => {
        it('it mocks a succesful should test', (done) => {
            "1".should.equal("1");
            done();
        });
    });
    describe('actually the first real Test', () => {
        it('it mocks a succesful should test', (done) => {
            "1".should.equal("1");
            done();
        });
    });

});
