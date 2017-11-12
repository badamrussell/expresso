const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const timesheetRouter = require('./timesheets');

const employeeRouter = express.Router();

function hasRequiredEmployeeFields(employeeData) {
  return employeeData.name &&
  employeeData.position &&
  employeeData.wage;
}

employeeRouter.param('employeeId', (req, res, next, id) => {
  const employeeId = Number(id);
  db.get('SELECT * FROM Employee WHERE id = $id', { $id: employeeId }, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      req.employeeId = employeeId;
      next();
    } else {
      res.status(404).send();
    }
  });

});

employeeRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE is_current_employee = 1', (error, employees) => {
    if (error) {
      next(error);
      return;
    }
    res.send({ employees });
  })
});

employeeRouter.post('/', (req, res, next) => {
  const employeeData = req.body.employee;

  if (!hasRequiredEmployeeFields(employeeData)) {
    return res.status(400).send();
  }

  db.run('INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)', {
    $name: employeeData.name,
    $position: employeeData.position,
    $wage: employeeData.wage,
  }, function(error) {
    if (error) {
      // return res.status(500).send();
      // res.status(500).send();
      next(error);
      return;
    }

    db.get('SELECT * FROM Employee WHERE id = $id', { $id: this.lastID }, (error, employee) => {
      if (error) {
        // res.status(500).send();
        next(error);
        return;
      }

      res.status(201).send({ employee });
    });
  });

});


employeeRouter.get('/:employeeId', (req, res, next) => {
  res.send({ employee: req.employee });
});

employeeRouter.put('/:employeeId', (req, res, next) => {
  const employeeData = req.body.employee;
  const employeeId = req.employeeId;

  if (!hasRequiredEmployeeFields(employeeData)) {
    res.status(400).send();
    return;
  }

  db.run('UPDATE Employee SET name = $name, position = $position, wage = $wage', {
    $name: employeeData.name,
    $position: employeeData.position,
    $wage: employeeData.wage,
  }, (error) => {
    if (error) {
      // res.status(500).send();
      // return;
      next(error);
      return;
    }

    db.get('SELECT * FROM Employee WHERE id = $id', { $id: employeeId }, (error, employee) => {
      if (error) {
      // res.status(500).send();
      // return;
      next(error);
      return;
      }

      res.status(200).send({ employee });
    });
  });
});

employeeRouter.delete('/:employeeId', (req, res, next) => {
  db.run('UPDATE Employee SET is_current_employee = 0 WHERE id IS $id', { $id: req.employee.id }, (error) => {
    if (error) {
      // res.status(500).send();
      // return;
      next(error);
      return;
    }

    db.get('SELECT * FROM Employee WHERE id = $id', { $id: req.employee.id }, (error1, employee) => {
      if (error1) {
      // res.status(500).send();
      // return;
      next(error1);
      return;
      }

      res.status(200).send({ employee });
    });
  });
});

employeeRouter.use('/:employeeId/timesheets', timesheetRouter);

module.exports = employeeRouter;
