const { QueryTypes } = require('sequelize');
const sequelize = require('./config/database');

// La fonction qui convertit une date UTC en AAAA-MM-JJ dans le bon fuseau horaire local
const convertDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    // 'fr-CA' est une astuce pour obtenir le format AAAA-MM-JJ de manière fiable
    return date.toLocaleDateString('fr-CA');
};

const migrate = async () => {
    const queryInterface = sequelize.getQueryInterface();

    // On définit ici toutes les colonnes que l'on doit migrer
    const columnsToMigrate = [
        { table: 'Transactions', column: 'date' },
        { table: 'Transactions', column: 'startDate' },
        { table: 'Transactions', column: 'endDate' },
        { table: 'ProjectBudgets', column: 'startDate' },
        { table: 'ProjectBudgets', column: 'endDate' },
    ];

    console.log('--- Démarrage de la migration des dates ---');

    for (const { table, column } of columnsToMigrate) {
        const tempColumn = `${column}_new`;
        console.log(`\nTraitement de la table [${table}], colonne [${column}]...`);

        try {
            // 1. Lire toutes les données existantes
            console.log('  1. Lecture des données actuelles...');
            const data = await sequelize.query(`SELECT id, "${column}" FROM "${table}"`, { type: QueryTypes.SELECT });

            if (data.length === 0) {
                console.log('  -> Aucune donnée à migrer pour cette colonne. Passage au changement de type direct.');
                await queryInterface.changeColumn(table, column, { type: 'DATEONLY' });
                continue;
            }

            // 2. Créer la nouvelle colonne temporaire
            console.log(`  2. Création de la colonne temporaire [${tempColumn}]...`);
            await queryInterface.addColumn(table, tempColumn, { type: 'DATEONLY' });

            // 3. Convertir et copier les données
            console.log('  3. Conversion et copie des données...');
            for (const row of data) {
                const newDate = convertDate(row[column]);
                if (newDate) {
                    await sequelize.query(`UPDATE "${table}" SET "${tempColumn}" = :newDate WHERE id = :id`, {
                        replacements: { newDate, id: row.id },
                        type: QueryTypes.UPDATE
                    });
                }
            }

            // 4. Supprimer l'ancienne colonne
            console.log(`  4. Suppression de l'ancienne colonne [${column}]...`);
            await queryInterface.removeColumn(table, column);

            // 5. Renommer la colonne temporaire
            console.log(`  5. Renommage de [${tempColumn}] en [${column}]...`);
            await queryInterface.renameColumn(table, tempColumn, column);

            console.log(`-> Migration de [${table}.${column}] terminée avec succès !`);

        } catch (error) {
            console.error(`\nERREUR lors de la migration de [${table}.${column}]:`, error.message);
            console.error('La migration est interrompue. Veuillez vérifier la base de données.');
            process.exit(1); // On arrête tout en cas d'erreur
        }
    }

    console.log('\n--- Migration de toutes les dates terminée avec succès ! ---');
    await sequelize.close();
};

migrate();