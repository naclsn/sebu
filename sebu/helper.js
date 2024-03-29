module.exports = class Helper {

    constructor(database, host="localhost", user="root", password="", callback=null) {
        this.conn = require('mysql').createConnection({
            host: host,
            database: database,
            user: user,
            password: password
        });

        let log = (tag, txt) => this.log(tag, txt);
        this.conn.connect(function(err) {
            if (err) {
                if (callback) callback(err);
                else throw err;
            } else {
                log('hay', "Connected!");
                if (callback) callback();
            }
        });
    }

    stop(callback) {
        this.conn.end(callback);
    }

    /**
     * ### Replace values
     * 
     * Use `%n` to replace by the corresponding value.
     * 
     * ### Colors reference
     * 
     * Use `$n` to change color.
     * 
     * - Reset              = "\x1b[0m"
     * - Bright             = "\x1b[1m"
     * - Dim                = "\x1b[2m"
     * - Underscore         = "\x1b[4m"
     * - Blink              = "\x1b[5m"
     * - Reverse            = "\x1b[7m"
     * - Hidden             = "\x1b[8m"
     * 
     * - Foreground Black   = "\x1b[30m"
     * - Foreground Red     = "\x1b[31m"
     * - Foreground Green   = "\x1b[32m"
     * - Foreground Yellow  = "\x1b[33m"
     * - Foreground Blue    = "\x1b[34m"
     * - Foreground Magenta = "\x1b[35m"
     * - Foreground Cyan    = "\x1b[36m"
     * - Foreground White   = "\x1b[37m"
     * 
     * - Background Black   = "\x1b[40m"
     * - Background Red     = "\x1b[41m"
     * - Background Green   = "\x1b[42m"
     * - Background Yellow  = "\x1b[43m"
     * - Background Blue    = "\x1b[44m"
     * - Background Magenta = "\x1b[45m"
     * - Background Cyan    = "\x1b[46m"
     * - Background White   = "\x1b[47m"
     * 
     * @param {String} template template string to format
     * @param {...any} values values replaced in the returned string
     * @returns a string formatted with the given template and values
     */
    format(template, ...values) { // TODO: highly optimisable
        return (template || "").toString()
                .replace(/%([0-9]+)/g, (m, k) => values[k] || m).replace("%%", "%")
                .replace("%&", values.join(", "))
                .replace(/\$([0-9]+)/g, "\x1b[$1m").replace("$$", "$");
    }

    log(tag, text, ...val) {
        console.log(this.format(`$2[${tag}]: $35${text}$0`, val));
    }

    splitOnce(text, separator) {
        if (!text) return [ null, null ];
        if (!text.includes(separator)) return [ text, null ];

        let k = text.indexOf(separator);
        return [ text.substring(0, k), text.substring(k + separator.length) ];
    }

    toDicoLang(text, dico) {
        for (let wordInLang in dico)
            text = text.replace(RegExp(`([ \[\]]|^)(${dico[wordInLang]})([ \[\]]|$)`, "gi"), `$1${wordInLang}$3`);
        return text;
    }

    where(obj) {
        if (!obj) return "";

        let builder = [];
        for (let key in obj)
            builder.push(`\`${key}\` = '${obj[key]}'`); // TODO: see `this.conn.escape` -> create encapsulation

        return "WHERE " + builder.join(" AND ");
    }

    query(sql) {
        sql = sql.replace(";", "?");
        this.log('sql', sql);

        return new Promise((resolve, reject) => {
            this.conn.query(sql, null, (err, rows) => err ? reject(err) : resolve(rows));
        }).catch(err => this.log('sql', `$31${err.stack}`));
    }

    insert(table, obj) {
        let keys = [], values = [];
        for (let key in obj) {
            keys.push(`\`${key}\``);
            values.push(`'${obj[key]}'`); // TODO: see `this.conn.escape` -> create encapsulation
        }

        return this.query(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${values.join(", ")})`)
    }

    select(table, where) {
        return this.query(`SELECT * FROM ${table} ${this.where(where)}`);
    }

    update(table, where, obj) {
        let paires = [];
        for (let key in obj)
            paires.push(`\`${key}\` = '${obj[key]}'`); // TODO: see `this.conn.escape` -> create encapsulation

        return this.query(`UPDATE ${table} SET ${paires.join(", ")} ${this.where(where)}`);
    }

    delete(table, where) {
        return this.query(`DELETE FROM ${table} ${this.where(where)}`);
    }

}

/*-*/
