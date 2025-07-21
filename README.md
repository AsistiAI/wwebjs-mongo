# wwebjs-mongo
A MongoDB plugin for whatsapp-web.js! 

Use MongoStore to save your WhatsApp MultiDevice session on a MongoDB Database.

## Quick Links

* [Guide / Getting Started](https://wwebjs.dev/guide/authentication.html) _(work in progress)_
* [GitHub](https://github.com/jtourisNS/wwebjs-mongo)
* [npm](https://www.npmjs.com/package/wwebjs-mongo)

## Installation

The module is now available on npm! `npm i wwebjs-mongo`


## Example usage

```js
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(() => {
    const store = new MongoStore({ mongoose: mongoose });
    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000
        })
    });

    client.initialize();
});

```

## Delete Remote Session

How to force delete a specific remote session on the Database:

```js
await store.delete({session: 'yourSessionName'});
```

---

## Extensions and Community Contributions

This project was originally created by **Joaquin Touris**. The following features and optimizations have been added as community contributions, respecting the original authorship and spirit of the repository:

- **Support for multiple databases:** You can now specify the database name when creating a `MongoStore` instance.
- **Synchronization optimization:** Improved performance when interacting with MongoDB and GridFS.
- **`listSessions` method:** Easily list all sessions stored in the database.

### Public API Documentation

#### `new MongoStore({ mongoose, dbName })`
Creates a new store instance. Optionally specify a custom database name with `dbName`.

#### `async sessionExists({ session })`
Checks if a session exists in the database. Returns `true` or `false`.

#### `async save(options)`
Saves the session ZIP file to MongoDB GridFS. Expects `options.session` (session name) and a file named `<session>.zip` in the working directory.

#### `async extract(options)`
Extracts the session ZIP file from MongoDB GridFS and writes it to the path specified in `options.path`.

#### `async delete({ session })`
Deletes the session ZIP file and its chunks from MongoDB GridFS for the given session name.

#### `async listSessions()`
Returns an array with the names of all sessions stored in the database.

Example usage of the new features:

```js
// Create an instance using a custom database
const store = new MongoStore({ mongoose, dbName: 'myDatabase' });

// List all stored sessions
const sessions = await store.listSessions();
console.log(sessions); // ['session1', 'session2', ...]
```

> **Note:** These improvements are community contributions and are not part of the official npm package unless the original author decides to integrate them.