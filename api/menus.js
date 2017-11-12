const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemRouter = require('./menuItems');
const menuRouter = express.Router();

function hasRequiredMenuFields(menuData) {
  return !!menuData.title;
}

menuRouter.param('menuId', (req, res, next, id) => {
  const menuId = Number(id);
  db.get('SELECT * FROM Menu WHERE id = $id', { $id: menuId }, (error, menu) => {
    if (error) {
      next(error);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.status(404).send();
    }
  });
});

menuRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (error, menus) => {
    if (error) {
      next(error);
      return;
    }
    res.send({ menus });
  })
});

menuRouter.post('/', (req, res, next) => {
  const menuData = req.body.menu;

  if (!hasRequiredMenuFields(menuData)) {
    return res.status(400).send();
  }

  db.run('INSERT INTO Menu (title) VALUES ($title)', {
    $title: menuData.title,
  }, function(error) {
    if (error) {
      // return res.status(500).send();
      // res.status(500).send();
      next(error);
      return;
    }

    db.get('SELECT * FROM Menu WHERE id = $id', { $id: this.lastID }, (error, menu) => {
      if (error) {
        // res.status(500).send();
        next(error);
        return;
      }

      res.status(201).send({ menu });
    });
  });

});


menuRouter.get('/:menuId', (req, res, next) => {
  res.send({ menu: req.menu });
});

menuRouter.put('/:menuId', (req, res, next) => {
  const menuData = req.body.menu;
  const menuId = req.menu.id;

  if (!hasRequiredMenuFields(menuData)) {
    res.status(400).send();
    return;
  }

  db.run('UPDATE Menu SET title = $title WHERE $id = $id', {
    $title: menuData.title,
    $id: menuId,
  }, (error) => {
    if (error) {
      // res.status(500).send();
      // return;
      next(error);
      return;
    }

    db.get('SELECT * FROM Menu WHERE id = $id', { $id: menuId }, (error, menu) => {
      if (error) {
      // res.status(500).send();
      // return;
      next(error);
      return;
      }

      res.status(200).send({ menu });
    });
  });
});

menuRouter.delete('/:menuId', (req, res, next) => {
  const menu = req.menu;

  // console.log('>>>>>>>>>>>>>', menu.id);

  // db.all('SELECT * FROM MenuItem', (error, menuItems) => {
  //   console.log('???????', menuItems)
  // });

  db.get('SELECT * FROM MenuItem WHERE menu_id = $menu_id', { $menu_id: menu.id }, (error, menuItem) => {
    if (error) {
      // res.status(500).send();
      // return;
      next(error);
      return;
    }

    if (menuItem) {
      res.status(400).send();
      return;
    }

    db.run('DELETE FROM Menu WHERE id = $id', { $id: menu.id }, (error1) => {
      if (error1) {
      // res.status(500).send();
      // return;
      next(error1);
      return;
      }

      res.status(204).send({ menu });
    });
  });
});

menuRouter.use('/:menuId/menu-items', menuItemRouter);

module.exports = menuRouter;
