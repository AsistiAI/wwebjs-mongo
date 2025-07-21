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

  async sessionExists({ session }) {
    let multiDeviceCollection = this.db.collection(`whatsapp-${session}.files`);
    let hasExistingSession = await multiDeviceCollection.countDocuments();
    return !!hasExistingSession;
  }

  async save({ session }) {
    var bucket = new this.mongoose.mongo.GridFSBucket(this.db, {
      bucketName: `whatsapp-${session}`,
    });
    await new Promise((resolve, reject) => {
      fs.createReadStream(`${session}.zip`)
        .pipe(bucket.openUploadStream(`${session}.zip`))
        .on("error", (err) => reject(err))
        .on("close", () => resolve());
    });
    await this.#deletePrevious({ session, bucket });
  }

  async extract({ session, path }) {
    var bucket = new this.mongoose.mongo.GridFSBucket(this.db, {
      bucketName: `whatsapp-${session}`,
    });
    return new Promise((resolve, reject) => {
      bucket
        .openDownloadStreamByName(`${session}.zip`)
        .pipe(fs.createWriteStream(path))
        .on("error", (err) => reject(err))
        .on("close", () => resolve());
    });
  }

  async delete({ session }) {
    var bucket = new this.mongoose.mongo.GridFSBucket(this.db, {
      bucketName: `whatsapp-${session}`,
    });
    const documents = await bucket
      .find({ filename: `${session}.zip` })
      .toArray();
    await Promise.all(documents.map((doc) => bucket.delete(doc._id)));
  }

  async #deletePrevious({ session, bucket }) {
    const documents = await bucket
      .find({ filename: `${session}.zip` })
      .toArray();
    if (documents.length > 1) {
      const oldSession = documents.reduce((a, b) =>
        a.uploadDate < b.uploadDate ? a : b
      );
      return bucket.delete(oldSession._id);
    }
  }
}

module.exports = MongoStore;
