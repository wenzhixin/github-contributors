var fs = require('fs'),
    request = require('request'),
    async = require('async'),
    sprintf = require('sprintf'),
    moment = require('moment'),
    util = require('util'),

    USER = 'wenzhixin';
    REPO = 'multiple-select';

request(getOptions(sprintf('https://api.github.com/repos/%s/%s/stats/contributors', USER, REPO)), function(err, res, body) {
    if (err) {
        console.log(err);
        return;
    }
    var contents = [],
        contributors = JSON.parse(body);

    if (!util.isArray(contributors)) {
        console.log('Get contributors error: ' + body);
        return;   
    }

    contributors = contributors.sort(function(a, b) {
        if (a.total > b.total) return -1;
        if (a.total < b.total) return 1;
        return 0;
    });
    async.eachSeries(contributors, function(contributor, callback) {
        request(getOptions('https://api.github.com/users/' + contributor.author.login), function(err, res, body) {
            if (err) {
                console.log(err);
                return;
            }
            var user = JSON.parse(body);
            contents.push(
                '<tr>',
                '<td>' + (user.name || contributor.author.login) + '</td>',
                '<td><a href="' + contributor.author.html_url + '">' + contributor.author.login + '</a></td>',
                '<td>' + (user.email ? '<a href="mailto:' + user.email + '">' + user.email + '</a>' : '') + '</td>',
                '<td>' + (user.blog ? '<a href="' + user.blog + '">' + user.blog + '</a>' : '') + '</td>',
                '<td>' + contributor.total + '</td>',
                '</tr>'
            );
            console.log(sprintf('Add %s: OK...', contributor.author.login));
            callback();
        });
    }, function() {
        var template = fs.readFileSync('./CONTRIBUTORS.md').toString(),
            date = new Date();

        fs.writeFileSync(sprintf('%s-%s-CONTRIBUTORS.md', USER, REPO),
            sprintf(template, contents.join('\n'), moment(new Date()).format('YYYY-MM-DD')));
        console.log('OK...');
    });
});

function getOptions(url) {
    return {
        url: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.114 Safari/537.36'
        }
    };
}
