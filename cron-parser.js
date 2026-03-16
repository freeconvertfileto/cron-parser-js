(function() {
    var inputEl = document.getElementById('crpInput');
    var parseBtn = document.getElementById('crpParse');
    var errorEl = document.getElementById('crpError');
    var resultEl = document.getElementById('crpResult');
    var descriptionEl = document.getElementById('crpDescription');
    var breakdownEl = document.getElementById('crpBreakdown');
    var nextRunsEl = document.getElementById('crpNextRuns');

    var FIELD_NAMES = ['Minute', 'Hour', 'Day of Month', 'Month', 'Day of Week'];
    var FIELD_RANGES = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];
    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    function describeField(val, idx) {
        if (val === '*') return 'every value';
        if (val.indexOf('/') !== -1) {
            var p = val.split('/');
            return 'every ' + p[1] + ' (starting at ' + p[0] + ')';
        }
        if (val.indexOf(',') !== -1) {
            var names = idx === 3 ? MONTHS : (idx === 4 ? DAYS : null);
            return 'specific values: ' + val.split(',').map(function(v) {
                return names ? (names[parseInt(v, 10) - (idx === 3 ? 1 : 0)] || v) : v;
            }).join(', ');
        }
        if (val.indexOf('-') !== -1) {
            var p = val.split('-');
            return 'range ' + p[0] + ' to ' + p[1];
        }
        if (idx === 3) return MONTHS[parseInt(val, 10) - 1] || val;
        if (idx === 4) return DAYS[parseInt(val, 10)] || val;
        return 'exactly ' + val;
    }

    function humanReadable(parts) {
        var m = parts[0], h = parts[1], dom = parts[2], mo = parts[3], dow = parts[4];
        if (parts.join(' ') === '* * * * *') return 'Every minute';
        if (parts.join(' ') === '0 * * * *') return 'Every hour at minute 0';
        if (parts.join(' ') === '0 0 * * *') return 'Every day at midnight';
        if (parts.join(' ') === '0 0 * * 0') return 'Every Sunday at midnight';
        if (parts.join(' ') === '0 0 1 * *') return 'At midnight on the 1st of every month';
        if (parts.join(' ') === '0 0 1 1 *') return 'At midnight on January 1st (yearly)';

        var desc = 'At ';
        if (m === '*' && h === '*') desc += 'every minute';
        else if (m === '*') desc += 'every minute past hour ' + h;
        else if (h === '*') desc += 'minute ' + m + ' past every hour';
        else desc += h + ':' + (m.length === 1 ? '0' + m : m);

        if (dom !== '*') desc += ', on day ' + dom + ' of the month';
        if (mo !== '*') {
            var moName = MONTHS[parseInt(mo, 10) - 1] || mo;
            desc += ', in ' + moName;
        }
        if (dow !== '*') {
            var dowName = DAYS[parseInt(dow, 10)] || dow;
            desc += ', on ' + dowName;
        }
        return desc;
    }

    function parsePart(val, min, max) {
        var set = [];
        if (val === '*') {
            for (var i = min; i <= max; i++) set.push(i);
            return set;
        }
        if (val.indexOf('/') !== -1) {
            var p = val.split('/');
            var step = parseInt(p[1], 10);
            var start = p[0] === '*' ? min : parseInt(p[0], 10);
            for (var i = start; i <= max; i += step) set.push(i);
            return set;
        }
        if (val.indexOf(',') !== -1) {
            return val.split(',').map(function(v) { return parseInt(v.trim(), 10); });
        }
        if (val.indexOf('-') !== -1) {
            var p = val.split('-');
            for (var i = parseInt(p[0], 10); i <= parseInt(p[1], 10); i++) set.push(i);
            return set;
        }
        return [parseInt(val, 10)];
    }

    function nextRuns(parts, count) {
        var minutes = parsePart(parts[0], 0, 59);
        var hours = parsePart(parts[1], 0, 23);
        var doms = parsePart(parts[2], 1, 31);
        var months = parsePart(parts[3], 1, 12);
        var dows = parsePart(parts[4], 0, 6);
        var domStar = parts[2] === '*';
        var dowStar = parts[4] === '*';

        var runs = [];
        var now = new Date();
        now.setSeconds(0, 0);
        now.setMinutes(now.getMinutes() + 1);

        var limit = 0;
        while (runs.length < count && limit < 100000) {
            limit++;
            var mo = now.getMonth() + 1;
            var d = now.getDate();
            var h = now.getHours();
            var mi = now.getMinutes();
            var dw = now.getDay();

            if (months.indexOf(mo) === -1) {
                now = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
                continue;
            }

            var domMatch = domStar || doms.indexOf(d) !== -1;
            var dowMatch = dowStar || dows.indexOf(dw) !== -1;
            var dayMatch = (!domStar && !dowStar) ? (domMatch || dowMatch) : (domMatch && dowMatch);

            if (!dayMatch) {
                now = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
                continue;
            }

            if (hours.indexOf(h) === -1) {
                var nextH = null;
                for (var i = 0; i < hours.length; i++) { if (hours[i] > h) { nextH = hours[i]; break; } }
                if (nextH === null) {
                    now = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
                } else {
                    now.setHours(nextH, 0, 0, 0);
                }
                continue;
            }

            if (minutes.indexOf(mi) === -1) {
                var nextM = null;
                for (var i = 0; i < minutes.length; i++) { if (minutes[i] > mi) { nextM = minutes[i]; break; } }
                if (nextM === null) {
                    var nextHIdx = -1;
                    for (var i = 0; i < hours.length; i++) { if (hours[i] > h) { nextHIdx = i; break; } }
                    if (nextHIdx === -1) {
                        now = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
                    } else {
                        now.setHours(hours[nextHIdx], 0, 0, 0);
                    }
                } else {
                    now.setMinutes(nextM, 0, 0);
                }
                continue;
            }

            runs.push(new Date(now));
            now.setMinutes(now.getMinutes() + 1);
        }
        return runs;
    }

    function validatePart(val, min, max) {
        if (val === '*') return true;
        if (/^\*\/\d+$/.test(val)) return true;
        if (/^\d+-\d+$/.test(val)) {
            var p = val.split('-');
            return parseInt(p[0]) >= min && parseInt(p[1]) <= max && parseInt(p[0]) <= parseInt(p[1]);
        }
        if (/^[\d,]+$/.test(val)) {
            return val.split(',').every(function(v) {
                var n = parseInt(v, 10);
                return n >= min && n <= max;
            });
        }
        if (/^\d+$/.test(val)) {
            var n = parseInt(val, 10);
            return n >= min && n <= max;
        }
        return false;
    }

    function doParse() {
        if (!inputEl) return;
        var raw = inputEl.value.trim();
        if (!raw) return;

        var parts = raw.split(/\s+/);
        if (parts.length < 5 || parts.length > 6) {
            showError('Invalid cron expression. Expected 5 fields (minute hour dom month dow).');
            return;
        }
        if (parts.length === 6) parts = parts.slice(1); // strip seconds if present

        for (var i = 0; i < 5; i++) {
            if (!validatePart(parts[i], FIELD_RANGES[i][0], FIELD_RANGES[i][1])) {
                showError('Invalid value "' + parts[i] + '" for field ' + FIELD_NAMES[i] + '.');
                return;
            }
        }

        hideError();
        if (descriptionEl) descriptionEl.textContent = humanReadable(parts);

        if (breakdownEl) {
            breakdownEl.innerHTML = '';
            for (var i = 0; i < 5; i++) {
                var item = document.createElement('div');
                item.className = 'crp-breakdown-item';
                item.innerHTML = '<span class="crp-breakdown-field">' + FIELD_NAMES[i] + '</span>' +
                    '<span class="crp-breakdown-value">' + parts[i] + '</span>' +
                    '<span class="crp-breakdown-desc">' + describeField(parts[i], i) + '</span>';
                breakdownEl.appendChild(item);
            }
        }

        if (nextRunsEl) {
            nextRunsEl.innerHTML = '';
            var runs = nextRuns(parts, 10);
            runs.forEach(function(d) {
                var li = document.createElement('li');
                li.textContent = d.toLocaleString();
                nextRunsEl.appendChild(li);
            });
        }

        if (resultEl) resultEl.style.display = '';
    }

    function showError(msg) {
        if (errorEl) { errorEl.textContent = msg; errorEl.style.display = ''; }
        if (resultEl) resultEl.style.display = 'none';
    }

    function hideError() {
        if (errorEl) { errorEl.style.display = 'none'; }
    }

    if (parseBtn) parseBtn.addEventListener('click', doParse);
    if (inputEl) {
        inputEl.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') doParse();
        });
    }
})();
