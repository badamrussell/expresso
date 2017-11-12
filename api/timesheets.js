const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetRouter = express.Router();

function hasRequiredTimesheetFields(timesheetData) {
  return timesheetData.hours &&
  timesheetData.rate &&
  timesheetData.date;
}

timesheetRouter.param('timesheetId', (req, res, next, id) => {
  const timesheetId = Number(id);
  db.get('SELECT * FROM Timesheet WHERE id = $id', { $id: timesheetId }, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      req.timesheet = timesheet;
      next();
    } else {
      res.status(404).send();
    }
  });

});

timesheetRouter.get('/', (req, res, next) => {
  const employee = req.employee;
  db.all('SELECT * FROM Timesheet WHERE employee_id = $employee_id', { $employee_id: employee.id }, (error, timesheets) => {
    if (error) {
      next(error);
      return;
    }
    res.send({ timesheets });
  })
});

timesheetRouter.post('/', (req, res, next) => {
  const employee = req.employee;
  const timesheetData = req.body.timesheet;

  if (!hasRequiredTimesheetFields(timesheetData)) {
    return res.status(400).send();
  }

  db.run('INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id)', {
    $hours: timesheetData.hours,
    $rate: timesheetData.rate,
    $date: timesheetData.date,
    $employee_id: employee.id,
  }, function(error) {
    if (error) {
      // return res.status(500).send();
      // res.status(500).send();
      next(error);
      return;
    }

    db.get('SELECT * FROM timesheet WHERE id = $id', { $id: this.lastID }, (error, timesheet) => {
      if (error) {
        // res.status(500).send();
        next(error);
        return;
      }

      res.status(201).send({ timesheet });
    });
  });

});


timesheetRouter.get('/:timesheetId', (req, res, next) => {
  res.send({ timesheet: req.timesheet });
});

timesheetRouter.put('/:timesheetId', (req, res, next) => {
  const timesheetData = req.body.timesheet;
  const timesheetId = req.timesheet.id;
  const employee = req.employee;

  if (!hasRequiredTimesheetFields(timesheetData)) {
    res.status(400).send();
    return;
  }

  db.run('UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employee_id WHERE Timesheet.id = $id', {
    $hours: timesheetData.hours,
    $rate: timesheetData.rate,
    $date: timesheetData.date,
    $employee_id: employee.id,
    $id: timesheetId,
  }, (error) => {
    if (error) {
      // res.status(500).send();
      // return;
      next(error);
      return;
    }

    db.get('SELECT * FROM Timesheet WHERE id = $id', { $id: timesheetId }, (error, timesheet) => {
      if (error) {
      // res.status(500).send();
      // return;
      next(error);
      return;
      }

      res.status(200).send({ timesheet });
    });
  });
});

timesheetRouter.delete('/:timesheetId', (req, res, next) => {
  const timesheetId = req.timesheet.id;

  db.run('DELETE FROM Timesheet WHERE id = $id', { $id: timesheetId }, (error, timesheet) => {
    if (error) {
      // res.status(500).send();
      // return;
      next(error);
      return;
    }

    res.status(204).send({ timesheet });
  });
});

module.exports = timesheetRouter;
