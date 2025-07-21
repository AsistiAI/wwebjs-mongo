const COLLECTION_NAME = "wwebjs-sessions";

class MongoStore {
  constructor({ mongoose, dbName } = {}) {
    if (!mongoose)
      throw new Error("A valid Mongoose instance is required for MongoStore.");
    this.mongoose = mongoose;
    this.dbName = dbName;
    this.db = dbName
      ? mongoose.connection.useDb(dbName)
      : mongoose.connection.db;
    this.collection = this.db.collection(COLLECTION_NAME);
  }

  /**
   * Guarda los datos de la sesión en la base de datos.
   * @param {Object} data - Datos serializados de la sesión.
   * @param {string} sessionId - Nombre/ID de la sesión.
   */
  async save(data, sessionId) {
    await this.collection.updateOne(
      { sessionId },
      { $set: { sessionId, data } },
      { upsert: true }
    );
  }

  /**
   * Obtiene los datos de la sesión desde la base de datos.
   * @param {string} sessionId - Nombre/ID de la sesión.
   * @returns {Object|null} Datos serializados de la sesión o null si no existe.
   */
  async get(sessionId) {
    const doc = await this.collection.findOne({ sessionId });
    return doc ? doc.data : null;
  }

  /**
   * Elimina la sesión de la base de datos.
   * @param {string} sessionId - Nombre/ID de la sesión.
   */
  async delete(sessionId) {
    await this.collection.deleteOne({ sessionId });
  }

  /**
   * Lista todos los IDs de sesión almacenados.
   * @returns {string[]} Array de sessionId.
   */
  async list() {
    const docs = await this.collection
      .find({}, { projection: { sessionId: 1 } })
      .toArray();
    return docs.map((doc) => doc.sessionId);
  }
}

module.exports = MongoStore;
