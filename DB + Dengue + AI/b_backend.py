# 1. Cargar la bbdd con langchain
from langchain.sql_database import SQLDatabase

db = SQLDatabase.from_uri("sqlite:///dengue.db")

# 2. Importar las APIs
import a_env_vars
import os
os.environ["OPENAI_API_KEY"] = a_env_vars.OPENAI_API_KEY

# 3. Crear el LLM
from langchain.chat_models import ChatOpenAI
# Modificar la URL de OpenAI a la URL del servidor local
llm = ChatOpenAI(temperature=0,model_name='gemini-1.5-flash')


# 4. **Importar SQLDatabaseChain desde el paquete correcto**
from langchain_experimental.sql import SQLDatabaseChain  # Importar desde langchain_experimental.sql

# 5. Crear la cadena
cadena = SQLDatabaseChain(llm = llm, database = db, verbose=False)

# 6. Formato personalizado de respuesta
formato = """
Data una pregunta del usuario:
1. crea una consulta de sqlite3
2. revisa los resultados
3. devuelve el dato
4. si tienes que hacer alguna aclaración o devolver cualquier texto que sea siempre en español
#{question}
"""

# 7. Función para hacer la consulta

def consulta(input_usuario):
    consulta = formato.format(question = input_usuario)
    resultado = cadena.run(consulta)
    return(resultado)
