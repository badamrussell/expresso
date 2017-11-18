const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemRouter = express.Router();

function hasRequiredMenItemFields(menuItemData) {
  return menuItemData.name &&
  menuItemData.inventory &&
  menuItemData.price;
}

menuItemRouter.param('menuItemId', (req, res, next, id) => {
  const menuItemId = Number(id);
  db.get('SELECT * FROM MenuItem WHERE id = $id', { $id: menuItemId }, (error, menuItem) => {
    if (error) {
      next(error);
    } else if (menuItem) {
      req.menuItem = menuItem;
      next();
    } else {
      res.status(404).send();
    }
  });
});

menuItemRouter.get('/', (req, res, next) => {
  const menu = req.menu;
  db.all('SELECT * FROM MenuItem WHERE menu_id = $menu_id', { $menu_id: menu.id }, (error, menuItems) => {
    if (error) {
      return next(error);
    }
    res.send({ menuItems });
  })
});

menuItemRouter.post('/', (req, res, next) => {
  const menu = req.menu;
  const menuItemData = req.body.menuItem;

  if (!hasRequiredMenItemFields(menuItemData)) {
    return res.status(400).send();
  }

  db.run('INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menu_id)', {
    $name: menuItemData.name,
    $description: menuItemData.description,
    $inventory: menuItemData.inventory,
    $price: menuItemData.price,
    $menu_id: menu.id,
  }, function(createError) {
    if (createError) {
      return next(createError);
    }

    db.get('SELECT * FROM MenuItem WHERE id = $id', { $id: this.lastID }, (selectError, menuItem) => {
      if (selectError) {
        return next(selectError);
      }

      res.status(201).send({ menuItem });
    });
  });

});


menuItemRouter.get('/:menuItemId', (req, res, next) => {
  res.send({ menuItem: req.menuItem });
});

menuItemRouter.put('/:menuItemId', (req, res, next) => {
  const menuItemData = req.body.menuItem;
  const menuItemId = req.menuItem.id;
  const menu = req.menu;

  if (!hasRequiredMenItemFields(menuItemData)) {
    return res.status(400).send();
  }

  db.run('UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price WHERE menuItem.id = $id', {
    $name: menuItemData.name,
    $description: menuItemData.description,
    $inventory: menuItemData.inventory,
    $price: menuItemData.price,
    $id: menuItemId,
  }, (updateError) => {
    if (updateError) {
      return next(updateError);
    }

    db.get('SELECT * FROM MenuItem WHERE id = $id', { $id: menuItemId }, (selectError, menuItem) => {
      if (selectError) {
        return next(selectError);
      }

      res.status(200).send({ menuItem });
    });
  });
});

menuItemRouter.delete('/:menuItemId', (req, res, next) => {
  const menuItemId = req.menuItem.id;

  db.run('DELETE FROM MenuItem WHERE id = $id', { $id: menuItemId }, (error, menuItem) => {
    if (error) {
      return next(error);
    }

    res.status(204).send({ menuItem });
  });
});

module.exports = menuItemRouter;
