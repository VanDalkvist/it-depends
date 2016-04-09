var Benchmark = require('benchmark');
var itDepends = require('../../out/dist/it-depends.js');
var ko = require('knockout');

module.exports = function(updatesCount, dependenciesCount) {
	Benchmark.prototype.args = {
		updatesCount: updatesCount,
		dependenciesCount: dependenciesCount,
		ko: ko,
		itDepends: itDepends
	};

	Benchmark.prototype.setup = function() {
		var updatesCount = this.args.updatesCount;
		var dependenciesCount = this.args.dependenciesCount;
		var ko = this.args.ko;
		var itDepends = this.args.itDepends;

		var initialValue = -1;

		function _noop() {
			return function() {};
		}
		
        function setupKnockout() {
            var x = [];
            for (var j = 0; j < dependenciesCount; j++) {
                x.push(ko.observable(-1));
            }

            var a = ko.pureComputed(function() {
                var z = 0;
                for (var j = 0; j < dependenciesCount; j++) {
                    z += x[j]();
                }
                return z;
            });

            var b = ko.pureComputed(function() {
                return a();
            });

            var c = ko.pureComputed(function() {
                return a();
            });

            var d = ko.observable(initialValue);

            var e = ko.pureComputed(function() {
                return d() % 2 == 0 ? b() : c();
            });

            var s = e.subscribe(function(){
                
            });
            
            return d;
        }
		
        function setupitDepends() {
            var x = [];
            for (var j = 0; j < dependenciesCount; j++) {
                x.push(itDepends.value(-1));
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
            
            return d;
        }
        
		var koobservable = setupKnockout();
		var idobservable = setupitDepends();
	};
	
	var suite = new Benchmark.Suite('computed diamond updated ' + updatesCount + ' times with ' + dependenciesCount + ' hidden dependencies');

	suite.add('knockout', function() {
		for (var j = 0; j < updatesCount; j++) {
			koobservable(j);
		}
	});

	suite.add('itDepends', function() {
		for (var j = 0; j < updatesCount; j++) {
			idobservable.write(j);
		}
	});

	return suite;
};
