import * as stmnts from './statements';
import clean from '../tools/deleteNullProperties.js';

const exportHasura = async (client, cidsClasses, attributes) => {
	// const { rows: cidsClasses } = await client.query(stmnts.classes);
	// const { rows: attributes } = await client.query(stmnts.attributes);
	const { rows: classattributes } = await client.query(stmnts.classAttributes);
	return analyzeAndPreprocess(cidsClasses, attributes, classattributes);
};

export function analyzeAndPreprocess(cidsClasses, attributes, classattributes) {
	let hasuraMeta = {
		version: 2,
		tables: []
	};

	let attrsPerTable = new Map();
	for (let a of attributes) {
		let tableAttributes = attrsPerTable.get(a.table);
		if (!tableAttributes) {
			tableAttributes = [];
			attrsPerTable.set(a.table, tableAttributes);
		}
		tableAttributes.push(a);
	}

	const tables = [
		'LEITUNG',
		'GEOM',
		'JT_LEITUNG_DOKUMENT',
		'MATERIAL_LEITUNG',
		'LEITUNGSTYP',
		'QUERSCHNITT',
		'DMS_URL',
		'URL',
		'URL_BASE'
	];

	for (let c of cidsClasses) {
		if (true || tables.indexOf(c.table) !== -1) {
			let objectRelationships = [];
			let arrayRelationships = [];

			let attrs = c.attributes;
			const tableMeta = {
				table: {
					schema: 'public',
					name: c.table.toLowerCase()
				}
			};
			for (const a of attrs) {
				if (a.cidsType !== undefined && a.extension_attr !== true) {
					//count the number of occurences of the remote table as fk relationship
					let occs = 0;
					let fieldNameDuplicate = false;
					for (const countingA of attrs) {
						if (countingA.cidsType !== undefined && countingA.cidsType === a.cidsType) {
							occs++;
						}
						if (
							countingA.cidsType !== undefined &&
							countingA.field.toLowerCase() === a.cidsType.toLowerCase()
						) {
							fieldNameDuplicate = true;
						}
					}
					let relName;
					if (occs > 1) {
						relName = a.field.toLowerCase() + '_' + a.cidsType.toLowerCase();
					} else {
						if (fieldNameDuplicate === true) {
							relName = a.cidsType.toLowerCase() + 'Object';
						} else {
							relName = a.cidsType.toLowerCase();
						}
					}
					const rel = getRelationship({
						name: relName,
						remoteTable: a.cidsType.toLowerCase(),
						columnMappingFrom: a.field.toLowerCase(),
						columnMappingTo: cidsClasses
							.find((el) => el.table === a.cidsType)
							.pk.toLowerCase()
					});
					objectRelationships.push(rel);
				} else if (a.manyToMany !== undefined && a.extension_attr !== true) {
					try {
						const rel = getRelationship({
							name: a.field.toLowerCase() + 'Array',
							remoteTable: a.manyToMany.toLowerCase(),
							columnMappingFrom: a.field.toLowerCase(),
							columnMappingTo: a.arrayKey.toLowerCase()
						});
						arrayRelationships.push(rel);
					} catch (e) {
						console.log(
							'problem during doing Array for ' +
								c.table +
								'.' +
								a.field +
								'->' +
								a.manyToMany +
								'.' +
								a.arrayKey,
							c
						);
					}
				} else if (a.oneToMany !== undefined && a.extension_attr !== true) {
					// try {
					const rel = getRelationship({
						name: a.oneToMany.toLowerCase() + '...Array',
						remoteTable: a.oneToMany.toLowerCase(),
						columnMappingFrom: c.pk.toLowerCase(),
						columnMappingTo: cidsClasses
							.find((el) => el.table === a.oneToMany)
							.attributes.find((attr) => attr.cidsType === c.table)
							.field.toLowerCase()
					});
					arrayRelationships.push(rel);
					// } catch (e) {
					// 	console.log(e);
					// 	console.log(
					// 		'problem during doing Array for ' +
					// 			c.table +
					// 			'.' +
					// 			a.field +
					// 			'->' +
					// 			a.manyToMany +
					// 			'.' +
					// 			a.arrayKey,
					// 		c
					// 	);
					// }
				}
			}
			if (objectRelationships.length > 0) {
				tableMeta.object_relationships = objectRelationships;
			}
			if (arrayRelationships.length > 0) {
				tableMeta.array_relationships = arrayRelationships;
			}
			hasuraMeta.tables.push(tableMeta);
		}
	}

	return {
		hasuraMeta
	};
}

const getRelationship = ({ name, remoteTable, columnMappingFrom, columnMappingTo }) => {
	let ret = {
		name: name,
		using: {
			manual_configuration: {
				remote_table: {
					schema: 'public',
					name: remoteTable
				},
				column_mapping: {}
			}
		}
	};
	ret.using.manual_configuration.column_mapping[columnMappingFrom] = columnMappingTo;
	return ret;
};

export default exportHasura;
