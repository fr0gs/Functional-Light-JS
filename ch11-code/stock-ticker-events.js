var server = connectToServer();

var formatDecimal = unboundMethod( "toFixed" )( 2 );
var formatPrice = pipe( formatDecimal, formatCurrency );
var formatChange = pipe( formatDecimal, formatSign );
var processNewStock = pipe( addStockName, formatStockNumbers );
var observableMapperFns = [ processNewStock, formatStockNumbers ];
var makeObservableFromEvent = curry( Rx.Observable.fromEvent, 2 )( server );

var [ newStocks, stockUpdates ] = pipe(
	map( makeObservableFromEvent ),
	curry( zip )( observableMapperFns ),
	map( spreadArgs( transformObservable ) )
)
( [ "stock", "stock-update" ] );


// *********************

function addStockName(stock) {
	return setProp( "name", stock, stock.id );
}

function formatStockNumbers(stock) {
	var updateTuples = [
		[ "price", formatPrice( stock.price ) ],
		[ "change", formatChange( stock.change ) ]
	];

	return reduce( function formatter(stock,[propName,val]){
		return setProp( propName, stock, val );
	} )
	( stock )
	( updateTuples );
}

function formatSign(val) {
	if (Number(val) > 0) {
		return `+${val}`;
	}
	return val;
}

function formatCurrency(val) {
	return `$${val}`;
}

function transformObservable(mapperFn,obsv){
	return obsv.map( mapperFn );
}
