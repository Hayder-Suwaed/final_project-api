const router = require("express").Router();
const getOrders = require("../db/queries");
module.exports = (db) => {
  router.get("/orders", (request, response) => {
    db.query(`SELECT * FROM orders;`)
      .then(({ rows: orders }) => {
        console.log(orders, "is it accessing here?");
        console.log(request)
        return response.json(orders);
      })
      .catch(e => {
        console.log(e.message);
        response.json({ error: true });
      });
  });
  router.post("/products-orders", (request, res) => {
    console.log("request.body", request.body.cartItems)
    const total = request.body.cartItems.reduce(function (tot, cartItem) {
      return tot + cartItem.subTotal;
    }, 0);
    db.query(`
    INSERT INTO orders (user_id, date_created, total)
    VALUES (1, Now(), $1)
    RETURNING *;
    `, [total])
      .then(({ rows: orders }) => {
        console.log(orders, "is it accessing here?");
        return orders;
      })
      .catch(e => {
        console.log(e.message);
        return ({ error: true });
      })
      .then(response => {
        console.log("request.body", request.body.cartItems)
        console.log("response", response)
        function expand(rowCount, columnCount, startAt = 1) {
          var index = startAt
          return Array(rowCount).fill(0).map(v => `(${Array(columnCount).fill(0).map(v => `$${index++}`).join(", ")})`).join(", ")
        }
        const productsOrdered = request.body.cartItems
        const table = productsOrdered.map(object => {
          return { productId: 1, qty: object.qty, orderId: response[0]["id"] }
        })
        const a = expand(productsOrdered.length, 3)
        console.log("expand", a)
        const flatten = table.map(obj => Object.values(obj)).flat()
        console.log("flatten", flatten)
        db.query(`
          INSERT INTO products_orders (product_id, quantity, order_id)
          VALUES ${a}
          RETURNING *;
        `, flatten)
          .then(({ rows: productsOrders }) => {
            console.log(productsOrders, "is it accessing here?");
            return res.json(productsOrders);
          })
          .catch(e => {
            console.log(e.message);
            return ({ error: true });
          });
      })
      .catch(e => {
        console.log(e.message);
        return ({ error: true });
      });
  });
  return router;
};

