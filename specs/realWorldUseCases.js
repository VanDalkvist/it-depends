var expect = require('chai').expect;
var itDepends = require('../out/build/it-depends.js');

describe('usage of the library in the real world scenarios', function () {
	context('conditional computeds', function () {
		var a;
		var b;
		var c;
		var d;
		var calls;
		
		beforeEach(function() {
			var counter = { count: 0 };
			calls = counter;
			
			a = itDepends.value(1);
			b = itDepends.value(2);
			c = itDepends.value(3);
			
			d = itDepends.computed(function() {
				++counter.count;
				if(a() === 1) {
					return b();
				}
				else {
					return c();
				}
			});
		});
			
		it('should not recalculate immediately', function () {
			expect(calls.count).to.equal(0);
		});
			
		it('should recalculate when requested', function () {
			var actualValue = d();
			
			expect(actualValue).to.equal(2);
			expect(calls.count).to.equal(1);
		});
		
		context('after changes are made', function () {		
			beforeEach(function() {
				a.write(4);
				b.write(5);
				c.write(6);
			});
			
			it('should not recalculate immediately', function () {
				expect(calls.count).to.equal(0);
			});
			
			it('should recalculate once when requested', function () {
				var actualValue = d();
				
				expect(actualValue).to.equal(6);
				expect(calls.count).to.equal(1);
			});
			
			it('should not recalculate when requested second time', function () {
				d();
				var actualValue = d();
				
				expect(actualValue).to.equal(6);
				expect(calls.count).to.equal(1);
			});
		});
		
		context('after was requested', function () {		
			beforeEach(function() {
				d();
			});
			
			it('should not recalculate when requested after a change is made to false condition branch variable', function () {
				c.write(6);

				var actualValue = d();
				
				expect(actualValue).to.equal(2);
				expect(calls.count).to.equal(1);
			});
		});
	});
	
	context('depending on the same value multiple times', function () {
		var a;
		var b;
		var c;
		var calls;
		
		beforeEach(function() {
			var counter = { count: 0 };
			calls = counter;
			
			a = itDepends.value(4);
			b = itDepends.value(5);
			
			c = itDepends.computed(function() {
				++counter.count;
				if(b() - a() === 1) {
					return a();
				}
				else {
					return b();
				}
			});
		});
			
		it('should not recalculate immediately', function () {
			expect(calls.count).to.equal(0);
		});
			
		it('should recalculate when requested', function () {
			var actualValue = c();
			
			expect(actualValue).to.equal(4);
			expect(calls.count).to.equal(1);
		});
		
		context('after change is made', function () {		
			beforeEach(function() {
				a.write(3);
			});
			
			it('should not recalculate immediately', function () {
				expect(calls.count).to.equal(0);
			});
			
			it('should recalculate once when requested', function () {
				var actualValue = c();
				
				expect(actualValue).to.equal(5);
				expect(calls.count).to.equal(1);
			});
			
			it('should not recalculate when requested second time', function () {
				c();
				var actualValue = c();
				
				expect(actualValue).to.equal(5);
				expect(calls.count).to.equal(1);
			});
		});
		
		context('after was requested and a change is made', function () {		
			beforeEach(function() {
				c();
				a.write(3);
			});
			
			it('should recalculate once when requested', function () {
				var actualValue = c();
				
				expect(actualValue).to.equal(5);
				expect(calls.count).to.equal(2);
			});
			
			it('should not recalculate when requested second time', function () {
				c();
				var actualValue = c();
				
				expect(actualValue).to.equal(5);
				expect(calls.count).to.equal(2);
			});
		});
	});
    
	context('diamond dependencies', function () {
		it('should work', function() {
            var dependenciesCount = 3;
            var updatesCount = 3;
            
            var x = [];
            for (var j = 0; j < dependenciesCount; j++) {
                x.push(itDepends.value(j));
            }

            var a = itDepends.computed(function() {
                var z = 0;
                for (var j = 0; j < dependenciesCount; j++) {
                    z += x[j]();
                }
                return z;
            });

            var b = itDepends.computed(function() {
                return a();
            });

            var c = itDepends.computed(function() {
                return a();
            });

            var d = itDepends.value(-1);

            var e = itDepends.computed(function() {
                return d() % 2 == 0 ? b() : c();
            });

            var s = e.onChange(function(){
                
            });
            
            for (var j = 0; j < updatesCount; j++) {
                d.write(j);
            }
		});
    });
});
