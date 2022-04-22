import express from "express";
import mysql from "mysql";
import "dotenv/config";

const { LOCAL_PORT, DB_HOST, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
const PORT = process.env.PORT || LOCAL_PORT;
const app = express();

// Reglages express
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Connexion à la DB
const pool = mysql.createPool({
  host: DB_HOST,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
});
// Test
console.log(`connected to database : ${pool.config.connectionConfig.database}`);

/* -------------------------------------------------------------------------- */
/*                                   ROUTES                                   */
/* -------------------------------------------------------------------------- */
//
//
//
/* -------------------------------------------------------------------------- */
/*                                    HOME                                    */
/* -------------------------------------------------------------------------- */
app.get("/", (req, res) => {
  const postsQuery = `SELECT post.Id, post.Title, post.Author_Id, post.CreationTimestamp, 
    CONCAT(SUBSTRING(post.Contents, 1, 40),'...') as Contents , author.FirstName, author.LastName
    FROM post 
    INNER JOIN author on author.Id = post.Author_Id 
    ORDER BY post.CreationTimestamp DESC`;

  pool.query(postsQuery, (error, results) => {
    res.render("template", { template: "home", data: results });
  });
});

/* -------------------------------------------------------------------------- */
/*                              DETAILS D'UN POST                             */
/* -------------------------------------------------------------------------- */
app.get("/post/:id", (req, res) => {
  const postId = req.params.id;
  const postQuery = `SELECT post.Id, post.Title, post.Contents, author.FirstName, author.LastName
  FROM post
  INNER JOIN author ON author.Id = post.Author_Id
  WHERE post.Id = ?`;
  const commentsQuery = `SELECT post.Title, post.Contents, author.FirstName, author.LastName, comment.NickName, comment.Contents, comment.CreationTimestamp
  FROM comment 
  INNER JOIN post ON post.Id = comment.Post_Id 
  INNER JOIN author on author.Id = post.Author_Id 
  WHERE post.Id = ?`;

  pool.query(postQuery, [postId], (error, post) => {
    pool.query(commentsQuery, [postId], (error, comments) => {
      res.render("template", {
        template: "post",
        post: post[0],
        comments: comments,
      });
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                              COMMENTER UN POST                             */
/* -------------------------------------------------------------------------- */
app.post("/post/:id", (req, res) => {
  const id = req.params.id;
  const insertCommentQuery = `INSERT INTO comment (NickName, Contents, Post_Id, CreationTimestamp) VALUES (?,?,?,?)`;
  pool.query(
    insertCommentQuery,
    [req.body.alias, req.body.message, id, new Date()],
    (err, result) => {
      res.redirect(`/post/${id}`);
    }
  );
});

/* -------------------------------------------------------------------------- */
/*                                 ADMIN PAGE                                 */
/* -------------------------------------------------------------------------- */
app.get("/admin", (req, res) => {
  const postQuery = `SELECT post.Id, post.Title, CONCAT(SUBSTRING(post.Contents, 1, 40),'...') as Contents, author.FirstName, author.LastName, category.Name
  FROM post
  INNER JOIN author ON author.Id = post.Author_Id
  INNER JOIN category ON category.Id = post.Category_Id`;
  pool.query(postQuery, (err, results) => {
    res.render("template", { template: "admin/admin", posts: results });
  });
});

/* -------------------------------------------------------------------------- */
/*                                 INSERT POST                                */
/* -------------------------------------------------------------------------- */
// Affichage du formulaire
app.get("/admin/post", (req, res) => {
  const categoriesQuery = "SELECT * FROM category";
  const authorsQuery = "SELECT * FROM author";
  pool.query(categoriesQuery, (err, categories) => {
    pool.query(authorsQuery, (err, authors) => {
      res.render("template", {
        template: "admin/admin-post",
        categories: categories,
        authors: authors,
      });
    });
  });
});

app.post("/admin/post", (req, res) => {
  const insertPostQuery = `INSERT INTO post (Title, Contents, CreationTimestamp, Author_Id, Category_Id) VALUES (?,?,?,?,?)`;
  pool.query(
    insertPostQuery,
    [
      req.body.title,
      req.body.content,
      new Date(),
      req.body.author,
      req.body.category,
    ],
    (err, results) => {
      res.redirect("/admin");
    }
  );
});

/* -------------------------------------------------------------------------- */
/*                                 UPDATE POST                                */
/* -------------------------------------------------------------------------- */
// Affichage du formulaire
app.get("/admin/update/:id", (req, res) => {
  const postId = req.params.id;
  const postQuery = "SELECT Id, Title, Contents FROM post WHERE Id = ?";
  pool.query(postQuery, [postId], (err, result) => {
    res.render("template", { template: "admin/admin-update", post: result[0] });
  });
});

app.post("/admin/update/:id", (req, res) => {
  const postId = req.params.id;
  const updatePostQuery =
    "UPDATE post SET Title = ?, Contents = ? WHERE Id = ?";

  pool.query(
    updatePostQuery,
    [req.body.title, req.body.content, postId],
    (err, result) => {
      res.redirect("/admin");
    }
  );
});

/* -------------------------------------------------------------------------- */
/*                                DELETE POST                                 */
/* -------------------------------------------------------------------------- */
app.get("/admin/delete/:id", (req, res) => {
  const postId = req.params.id;
  const deleteQuery = "DELETE FROM post WHERE Id = ?";
  pool.query(deleteQuery, [postId], (err, result) => {
    res.redirect("/admin");
  });
});

app.listen(PORT, () => {
  console.log("Listening to localhost:" + PORT);
});
