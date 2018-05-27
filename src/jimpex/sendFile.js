const { provider } = require('jimple');

class RollupSendFile {
  constructor(frontendFs) {
    this.frontendFs = frontendFs;
    this.sendFile = this.sendFile.bind(this);
  }

  sendFile(res, filepath, next = () => {}) {
    this.frontendFs.read(filepath)
    .then((contents) => {
      res.write(contents);
      res.end();
    })
    .catch((error) => {
      next(error);
    });
  }
}

const rollupSendFile = provider((app) => {
  app.set('sendFile', () => new RollupSendFile(
    app.get('frontendFs')
  ).sendFile);
});

module.exports = {
  RollupSendFile,
  rollupSendFile,
};
