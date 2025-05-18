const { ref, get, query } = require("firebase/database");
const { db } = require("./firebaseConfig");

async function getUser(accessToken) {
  if (!accessToken) {
    console.log("Access token não fornecido");
    return null;
  }

  try {
    const refUsers = query(ref(db, "users"));
    const snapshot = await get(refUsers);

    if (snapshot.exists()) {
      const users = Object.values(snapshot.val()).filter(
        (user) => user.accessToken === accessToken
      );
      return users.length > 0 ? users : null;
    } else {
      console.log("Nenhum dado disponível");
      return null;
    }
  } catch (error) {
    console.error("Erro ao obter dados:", error);
    return null;
  }
}

async function getTodayBirthdays() {
  try {
    const refUsers = query(ref(db, "users"));
    const snapshot = await get(refUsers);

    if (snapshot.exists()) {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1; // Janeiro = 1, Dezembro = 12

      return Object.values(snapshot.val()).filter((user) => {
        if (!user.birthdate) return false;

        const parts = user.birthdate.split("/");
        if (parts.length !== 3) return false;

        const userDay = parseInt(parts[0], 10);
        const userMonth = parseInt(parts[1], 10);

        return userDay === day && userMonth === month;
      });
    } else {
      console.log("Nenhum dado disponível");
      return [];
    }
  } catch (error) {
    console.error("Erro ao obter aniversariantes:", error);
    return [];
  }
}

async function getRecentVisitors(daysAgo = 7) {
  try {
    const refVisitors = query(ref(db, "visitors"));
    const snapshot = await get(refVisitors);

    if (snapshot.exists()) {
      const today = new Date();
      const cutoffDate = new Date(today);
      cutoffDate.setDate(today.getDate() - daysAgo);

      return Object.values(snapshot.val()).filter((visitor) => {
        if (!visitor.visitDate) return false;

        const visitDate = new Date(visitor.visitDate);
        return visitDate >= cutoffDate && visitDate <= today;
      });
    } else {
      console.log("Nenhum visitante disponível");
      return [];
    }
  } catch (error) {
    console.error("Erro ao obter visitantes:", error);
    return [];
  }
}

module.exports = {
  getUser,
  getTodayBirthdays,
  getRecentVisitors,
};
