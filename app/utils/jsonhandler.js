//  Function to calculate the size of a JSON
// Thanks to in thomas-peter at StackOverflow
// http://stackoverflow.com/questions/1248302/javascript-object-size

function roughSizeOfObject( object ) {

  var objectList = [];
  var stack = [ object ];
  var bytes = 0;

  while ( stack.length ) {
    var value = stack.pop();

    if ( typeof value === 'boolean' ) {
      bytes += 4;
    }

    else if ( typeof value === 'string' ) {
      bytes += value.length * 2;
    }

    else if ( typeof value === 'number' ) {
      bytes += 8;
    }
    
    else if(typeof value === 'object' && objectList.indexOf( value ) === -1){
      objectList.push( value );

      for( var i in value ) {
        stack.push( value[ i ] );
      }
    }
  }
  return bytes;
}