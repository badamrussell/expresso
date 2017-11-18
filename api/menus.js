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
      return next(error);
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
  }, function(createError) {
    if (createError) {
      return next(createError);
    }

    db.get('SELECT * FROM Menu WHERE id = $id', { $id: this.lastID }, (selectError, menu) => {
      if (selectError) {
        return next(selectError);
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
    return res.status(400).send();
  }

  db.run('UPDATE Menu SET title = $title WHERE $id = $id', {
    $title: menuData.title,
    $id: menuId,
  }, (updateError) => {
    if (updateError) {
      return next(updateError);
    }

    db.get('SELECT * FROM Menu WHERE id = $id', { $id: menuId }, (selectError, menu) => {
      if (selectError) {
        return next(selectError);
      }

      res.status(200).send({ menu });
    });
  });
});

menuRouter.delete('/:menuId', (req, res, next) => {
  const menu = req.menu;

  db.get('SELECT * FROM MenuItem WHERE menu_id = $menu_id', { $menu_id: menu.id }, (selectError, menuItem) => {
    if (selectError) {
      return next(selectError);
    }

    if (menuItem) {
      return res.status(400).send();
    }

    db.run('DELETE FROM Menu WHERE id = $id', { $id: menu.id }, (deleteError) => {
      if (deleteError) {
        return next(deleteError);
      }

      res.status(204).send({ menu });
    });
  });
});

menuRouter.use('/:menuId/menu-items', menuItemRouter);

module.exports = menuRouter;
