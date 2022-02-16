/* Dependencias */
const AWS = require("aws-sdk");

/* Datos de prueba */
// const postPrueba = require("./ejemplo.json");
const evento = require("./event.json");

/* Configuración */

AWS.config.update({
    region: "us-east-1",
    endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

const TABLA = "alucloud185-serverless";

/* HANDLER disparado por API GATEWAY */
exports.handler = async (event) => {
    // console.log(event);
    // var respuesta = {
    //     statusCode: 200,
    //     message: "Hola mundo"
    // };
    
    
    /* SDK Dynamodb */
    var dynamodb = new AWS.DynamoDB();
    var clienteDynamodb = new AWS.DynamoDB.DocumentClient();

    /* Análisis de la petición */
    var httpMethod = event.requestContext.http.method;
    var respuesta;

    switch (httpMethod) {
        case "POST":
            console.log("Me ha llegado una petición POST");
            var body = JSON.parse(event.body);
            try{
                await insertPost(clienteDynamodb, body, TABLA);
                respuesta = {
                    statusCode: 200,
                    headers: { 
                        "Access-Control-Allow-Headers" : "Content-Type",
                        "Access-Control-Allow-Methods" : "POST,GET"
                    },
                    body: "Objeto insertado en DynamoDB correctamente"
                };

            } catch (err) {

                console.log("Error en la inserción");
                respuesta = {
                    statusCode: 500,
                    headers: { 
                        "Access-Control-Allow-Headers" : "Content-Type",
                        "Access-Control-Allow-Methods" : "POST,GET"
                    },
                    body: "Fallo en la operación de inserción de objeto"
                };
            }
            break;

        case "GET":
            console.log("Me ha llegado una petición GET");
            try{
                var respuestaBody = await scan(clienteDynamodb, TABLA);
                respuesta = {
                    statusCode: 200,
                    headers: { 
                        "Access-Control-Allow-Headers" : "Content-Type",
                        "Access-Control-Allow-Methods" : "POST,GET"
                    },
                    body: respuestaBody
                };
            } catch (err) {
                console.log("Error en la lectura de la tabla");
                respuesta = {
                    statusCode: 500,
                    headers: { 
                        "Access-Control-Allow-Headers" : "Content-Type",
                        "Access-Control-Allow-Methods" : "POST,GET"
                    },
                    body: "Fallo en la operación de lectura de DynamoDB"
                };
            }
            break;

        default:
            console.log("La petición no se corresponde con ninguna de las aceptadas");
            break;
    }



    return JSON.stringify(respuesta);
}



/* Función para intertar elemento en la tabla */

const insertPost = (clientedb, data, tabla) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tabla,
            Item:{
                "title": data.title,
                "components": JSON.stringify(data.components)
            }
        };
    
    
        clientedb.put(params, (err,data) => {
            if (err) {
                console.error("No se ha podido insertar el item. Error JSON:",JSON.stringify(err,null,2));
                reject(err);
            } else {
                console.log("Item añadido:", JSON.stringify(data, null, 2));
                resolve(data);
            }
        });
    });
}

/* Función para realizar una query a la tabla */

const query = (clientedb, key, value, tabla) => {
    return new Promise((resolve,reject) => {
        const params = {
            TableName : tabla,
            KeyConditionExpression: `${key} = :nombre`,
            ExpressionAttributeValues: {
                ":nombre": value
            }
        };
    
        clientedb.query(params, (err,data) => {
            if (err) {
                console.error("No se ha encontrado item. Error JSON:",JSON.stringify(err,null,2));
            } else {
                console.log("Objeto encontrado:", JSON.stringify(data, null, 2));
            }
        });
    });
}

/* Función para sacar toda la tabla */

const scan = (clientedb, tabla) => {
    return new Promise((resolve,reject) => {
        const params = {
            TableName: tabla
        };
        clientedb.scan(params, (err, data) => {
            if (err) {
                reject(err);
                console.error("No se ha podido escanear la tabla. Error JSON:",JSON.stringify(err,null,2));
            } else {
                /* Parseado de los datos */
                data = data.Items;
                data.forEach(elem => {
                    elem.components = JSON.parse(elem.components);
                });
                resolve(data);
            }
        });
    });
}

/* Creación de la tabla (opcional) */

const createTable = (dynamodb) => {
    var params = {
        TableName: "Formio",
        KeySchema: [
            { AttributeName: "title", KeyType: "HASH"}, // Partition key
            { AttributeName: "components", KeyType: "RANGE"} // Sort key
        ],
        AttributeDefinitions: [
            { AttributeName: "title", AttributeType: "S" },
            { AttributeName: "components", AttributeType: "S" }
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 2, 
            WriteCapacityUnits: 1
        }
    }

    dynamodb.createTable(params, (err,data) => {
        if (err){
            console.error("No se ha podido crear la tabala: Error JSON:",JSON.stringify(err,null,2));
        } else {
            console.log("Tabla creada. Descripción JSON:", JSON.stringify(data,null,2));
        }
    })
};



const main = async () => {
    // var dynamodb = new AWS.DynamoDB();
    // var clienteDynamodb = new AWS.DynamoDB.DocumentClient();

    // const tabla = "Formio";

    //createTable(dynamodb);

    // //insertPost(clienteDynamodb, postPrueba, tabla);

    // query(clienteDynamodb, "nombre", tabla);
    
    var respuesta = await this.handler(evento);
    console.log("*************** RESPUESTA DEL HANDLER ****************")
    console.log(respuesta);
}

//main();



