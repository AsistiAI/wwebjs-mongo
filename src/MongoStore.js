const fs = require("fs");

class MongoStore {
  constructor({ mongoose, dbName } = {}) {
    if (!mongoose)
      throw new Error("A valid Mongoose instance is required for MongoStore.");
    this.mongoose = mongoose;
    this.dbName = dbName;
    this.db = dbName
      ? mongoose.connection.useDb(dbName)
      : mongoose.connection.db;
  }

  async sessionExists(options) {
    let multiDeviceCollection = this.db.collection(
      `whatsapp-${options.session}.files`
    );
    let hasExistingSession = await multiDeviceCollection.countDocuments();
    return !!hasExistingSession;
  }

  async save(options) {
    var bucket = new this.mongoose.mongo.GridFSBucket(this.db, {
      bucketName: `whatsapp-${options.session}`,
    });
    await new Promise((resolve, reject) => {
      fs.createReadStream(`${options.session}.zip`)
        .pipe(bucket.openUploadStream(`${options.session}.zip`))
        .on("error", (err) => reject(err))
        .on("close", () => resolve());
    });
    options.bucket = bucket;
    await this.#deletePrevious(options);
  }

  async extract(options) {
    var bucket = new this.mongoose.mongo.GridFSBucket(this.db, {
      bucketName: `whatsapp-${options.session}`,
    });
    return new Promise((resolve, reject) => {
      bucket
        .openDownloadStreamByName(`${options.session}.zip`)
        .pipe(fs.createWriteStream(options.path))
        .on("error", (err) => reject(err))
        .on("close", () => resolve());
    });
  }

  async delete(options) {
    var bucket = new this.mongoose.mongo.GridFSBucket(this.db, {
      bucketName: `whatsapp-${options.session}`,
    });
    const documents = await bucket
      .find({
        filename: `${options.session}.zip`,
      })
      .toArray();

    await Promise.all(documents.map((doc) => bucket.delete(doc._id)));
  }

  async #deletePrevious(options) {
    const documents = await options.bucket
      .find({
        filename: `${options.session}.zip`,
      })
      .toArray();
    if (documents.length > 1) {
      const oldSession = documents.reduce((a, b) =>
        a.uploadDate < b.uploadDate ? a : b
      );
      return options.bucket.delete(oldSession._id);
    }
  }
}

module.exports = MongoStore;
