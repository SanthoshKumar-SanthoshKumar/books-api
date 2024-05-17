const express = require("express");
const app = express();

const sqlite3 = require("sqlite3").verbose();

// Middleware to parse JSON bodies
app.use(express.json());

const db = new sqlite3.Database("credenceUsers.db", (err) => {
    if (err) {
        console.error('Error Opening Database: ' , err.message);
    } else {
        console.log("Connected To Database");

        db.run(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            img TEXT NOT NULL,
            summary TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.log("Error Creating Table", err.message);
        } else {
            console.log("Books table Created Successfully");
        }
    });

    }
});

// create a New Table 


// Close the database connection after creating the table 
/*
db.close((error) => {
    if (error) {
        console.error('Error Closing Database ', error.message);
    } else {
        console.log("Closed the Database Connection");
    }
});
*/

// Route to handle POST requests to add books
app.post('/books', (req, res) => {
    try {
        const books = req.body;

        // Validate that the request body is an array
        if (!Array.isArray(books)) {
            return res.status(400).json({ error: 'Request body should be an array of books' });
        }

        const insertQuery = `
            INSERT INTO books (name, img, summary)
            VALUES (?, ?, ?)
        `;

        // Start a transaction
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            const stmt = db.prepare(insertQuery);

            books.forEach((book) => {
                const { name, img, summary } = book;
                // Validate the required fields
                if (!name || !img || !summary) {
                    db.run("ROLLBACK");
                    return res.status(400).json({ error: 'Each book must have name, img, and summary' });
                }
                stmt.run([name, img, summary]);
            });

            stmt.finalize();
            db.run("COMMIT", (err) => {
                if (err) {
                    console.error('Error committing transaction:', err.message);
                    return res.status(500).json({ error: 'Error committing transaction' });
                }

                res.status(201).json({ message: 'Books inserted successfully' });
            });
        });

    } catch (error) {
        console.error('Error inserting data:', error.message);
        res.status(500).json({ error: 'Error inserting data' });
    }
});

// GET one specified book Api 

app.get('/books/:id' ,(req,res)=>{
    const {id} = req.params ;
    try{
        const getBookQuery = `
        SELECT * FROM books WHERE id=?
      `
      db.get(getBookQuery,[id],(err,row)=>{
        if(err){
            return res.status(500).send(err.message)
        }
        if(!row){
            return res.status(404).send("Book Not Found")
        }
        res.status(201).json(row)
      })

    }catch(err){
        res.status(500).send(err.message)
    }
    
    

})

//GET all books API 

app.get('/books',(req,res)=>{
    try {
        const getBooksQuery = `SELECT * FROM books`;
        db.all(getBooksQuery, [], (err, rows) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.status(200).json(rows);
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
    
})

//UPDATE the book by id API

app.put('/books/:id',async(req,res)=>{
    const {name,img,summary} = req.body ;
    const {id}= req.params ;
    
    if(!name || !img || !summary){
        return res.status(400).json({error:'Name,img and Summary is Required'})
    }

    try{
        const updateBookQuery = `
        UPDATE books
        SET name =?, 
            img = ?, 
            summary = ?
        WHERE id = ?;
        `

     await db.run(updateBookQuery,[name,img,summary,id] ,(err)=>{
          if(err){
            return res.status(500).json({Error:'Error Updating Data'})
          }
          
        res.status(200).json({message:'Book Updated Successfully'})
    });

    }catch(error){
        res.status(500).send(error.message)
    }

})

//DELETE Book API
app.delete('/books/:id', async (req, res) => {
    const {id} = req.params ;
    try {
      const deleteBookQuery = `
        DELETE FROM books WHERE id=?
      ` 
     
      db.run(deleteBookQuery,[id],(err)=>{
        if(err){
            return res.status(500).send(err.message)
        }

        if (this.changes === 0) {
            return res.status(404).send('Book not found');
        }

        res.status(201).send("Book Deleted SuccessFully")
      })
    } catch (error) {
      res.status(500).send();
    }
});


// Start the server
app.listen(3000, () => {
    console.log(`Server Running At http://localhost:3000`);
});
