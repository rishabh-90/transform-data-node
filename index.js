const fs = require('fs');
const _ = require('lodash');
const { performance } = require('perf_hooks');

var startTime = performance.now();

const jsonString = fs.readFileSync('./input.json');
const input = JSON.parse(jsonString);

/**
 * Returns value Segment Key.
 *
 * @param {string} value Segment Value.
 * @return {string} value Segment Key.
 */
const segmentKey = (value) => {
  switch (value) {
    case 'Full Game':
      return 'fullTimeGameEvent';
    case '1st Game':
      return 'firstGame';
    case '2nd Game':
      return 'secondGame';
    case '3rd Game':
      return 'thirdGame';
  }
};

/**
 * Returns event Transformed Sporting Event.
 *
 * @param {object} event Sporting Event Object.
 * @return {string} event Transformed Sporting Event.
 */
const formateSportingEvent = (event) => {
  return {
    id: event.iGameCodeGlobalId,
    gameType: '18',
    date: event.date,
    time: event.time,
    gameID: event.iGameCodeGlobalId,
    homeTeam: event.homeTeam,
    homeTeamName: event.homeTeamName,
    homeTeamCity: event.homeTeamCity,
    homeTeamLogoUri: event.homeTeamLogoUri,
    visitingTeam: event.visitingTeam,
    visitingTeamName: event.visitingTeamName,
    visitingTeamCity: event.visitingTeamCity,
    visitingTeamLogoUri: event.visitingTeamLogoUri,
    teams: event.teams,
    sp: event.sp,
    section: 'featured',
    segment: event.segment,
    bestOf: Number(event.szGameType.replace(/[^0-9]/g, '')),
    gameMode: event.eGameMode,
    assoc: '',
    tournamentDisplayName: event.szTournamentDisplayName,
    segmentKey: segmentKey(event.segment),
  };
};

const _list = [];
const _sportingEvent = [];

_.forOwn(input.data.sporting_events, function (value) {
  let date = value.date + ' ' + value.time.substring(0, value.time.length - 2);
  _sportingEvent.push({
    ...value,
    date: new Date(date.substr(0, date.length - 2) + date.substr(-2)),
  });
});

//Transform Slate Events
input.data.slate_events.forEach(function (value) {
  let date = value.date + ' ' + value.time.substring(0, value.time.length - 2);
  delete value.time;
  _list.push({
    event: {
      id: value.szDescriptor.replace(' ', '_').toLowerCase(),
      gameType: '18',
      date: new Date(date.substr(0, date.length - 2) + date.substr(-2)),
      time: value.time,
      gameID: value.iGameCodeGlobalId,
      sp: value.sp,
      section: 'featured',
      bestOf: 1,
      gameMode: value.eGameMode,
    },
    isSlate: true,
    isStacked: false,
    sp: value.sp,
    date: new Date(date.substr(0, date.length - 2) + date.substr(-2)),
  });
});

//Group Sporting Events by Team and Event date and time
const groupSportEvents = _.chain(_sportingEvent)
  .groupBy('visitingTeam')
  .mapValues((ageArr) => _.groupBy(ageArr, (ageObj) => ageObj.uts))
  .value();

//Pushing Final Sporting Events to array
_.forOwn(groupSportEvents, function (sportEvents) {
  _.forOwn(sportEvents, function (value) {
    if (value.length > 1) {
      const events = [];
      value.forEach((event) => {
        events.push(formateSportingEvent(event));
      });
      _list.push({
        event: events,
        isSlate: false,
        isStacked: false,
        sp: value[0].sp,
        date: value[0].date,
      });
    } else {
      _list.push({
        event: formateSportingEvent(value[0]),
        isSlate: false,
        isStacked: false,
        sp: value[0].sp,
        date: value[0].date,
      });
    }
  });
});

//Sorting based on date and time (asc)
const sorted = _list.sort(function (a, b) {
  return a.date - b.date;
});

//Removing unwanted date from the final list
const finalOutput = sorted.map((event) => {
  return {
    ...event,
    date: undefined,
  };
});

//Saving date to output.json
fs.writeFile(
  'output.json',
  JSON.stringify(finalOutput, null, 2),
  function (err) {
    if (err) throw err;
    var endTime = performance.now();
    console.log(
      `Total Time Execution: --- ${endTime - startTime} milliseconds`
    );
  }
);
