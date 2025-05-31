FROM openjdk:8-jdk

# Instalar dependencias necesarias
RUN apt-get update && apt-get install -y \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Configurar variables de entorno de Java
ENV JAVA_HOME=/usr/local/openjdk-8
ENV PATH=$JAVA_HOME/bin:$PATH

# Verificar que Java esté disponible
RUN java -version

# Instalar Apache Pig
ENV PIG_VERSION=0.17.0
ENV PIG_HOME=/opt/pig
RUN wget https://archive.apache.org/dist/pig/pig-${PIG_VERSION}/pig-${PIG_VERSION}.tar.gz && \
    tar -xzf pig-${PIG_VERSION}.tar.gz && \
    mv pig-${PIG_VERSION} ${PIG_HOME} && \
    rm pig-${PIG_VERSION}.tar.gz

# Descargar Piggybank
ENV PIGGYBANK_VERSION=0.17.0
RUN mkdir -p /pig && wget https://repo1.maven.org/maven2/org/apache/pig/piggybank/${PIGGYBANK_VERSION}/piggybank-${PIGGYBANK_VERSION}.jar -O /pig/piggybank.jar

# Configurar variables de entorno finales
ENV PATH=${PIG_HOME}/bin:${PATH}
ENV PIG_CLASSPATH=${PIG_HOME}/lib

# Crear directorios necesarios
WORKDIR /pig
RUN mkdir -p results data

# Copiar scripts y datos
COPY ./pig_scripts/process_events.pig .
COPY ./pig_scripts/filter_data.pig .
COPY export_events.sh .
COPY new.csv data/

# Dar permisos de ejecución al script de exportación
RUN chmod +x export_events.sh

# Primero filtrado, despues procesado
CMD ["/bin/bash", "-c", "pig -x local filter_data.pig && ./export_events.sh && pig -x local process_events.pig"]
