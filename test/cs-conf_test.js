import chai from 'chai';

let should=chai.should();
let assert=chai.assert;

describe('cs-conf Tests:', () => {
    beforeEach((done) => { //Before each test we empty the database
      //Nothing atm 
      //console.log("beforeEach ...");
      done();
    });
  
    describe('actually the first cs-conf Test', () => {
      it('it mocks a succesful assert test', (done) => {
        assert.equal(1,1);
        done();
      });
    });
    describe('actually the second cs-conf Test', () => {
        it('it mocks a succesful should test', (done) => {
          "1".should.equal("1");
          done();
        });
      });
});