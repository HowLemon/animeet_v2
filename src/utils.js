export function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = year + ' ' + month + ' ' + date + ' ' + zerofill(hour) + ':' + zerofill(min) + ':' + zerofill(sec);
    return time;
}

export function zerofill(str) {
    return ('00' + str).slice(-2);
}

export function generatePayload(content, type, sender, timestamp = Date.now()) {
    return {
        content: content,
        type: type,
        timestamp: timestamp,
        sender: sender
    }
}

export function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}