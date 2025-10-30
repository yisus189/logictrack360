#!/bin/bash

# Quick Test Script for Data Space
# Este script te ayuda a verificar rápidamente que el Data Space funciona

echo "================================================"
echo "   Data Space - Script de Verificación Rápida"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Archivo .env no encontrado"
    echo "   Por favor copia .env.example a .env y configúralo"
    echo "   cp .env.example .env"
    exit 1
fi

echo "✅ Archivo .env encontrado"

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "⚠️  Dependencias no instaladas. Instalando..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando dependencias"
        exit 1
    fi
fi

echo "✅ Dependencias instaladas"

# Run linter
echo ""
echo "🔍 Ejecutando linter..."
npm run lint
if [ $? -ne 0 ]; then
    echo "⚠️  Advertencia: Problemas de linting detectados"
else
    echo "✅ Linter pasó correctamente"
fi

# Build the project
echo ""
echo "🔨 Compilando proyecto..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en la compilación"
    exit 1
fi

echo "✅ Compilación exitosa"

# Print next steps
echo ""
echo "================================================"
echo "   ✅ Verificación completada"
echo "================================================"
echo ""
echo "Siguiente paso: Ejecutar el servidor de desarrollo"
echo ""
echo "   npm run dev"
echo ""
echo "Luego abre tu navegador en: http://localhost:5173"
echo ""
echo "Para probar el Data Space:"
echo "   1. Haz clic en '📊 Datos' en el sidebar"
echo "   2. Sigue la guía en TESTING_GUIDE.md"
echo ""
echo "¿Necesitas configurar la base de datos?"
echo "   → Ver SETUP_GUIDE.md, sección 'Database Setup'"
echo ""
echo "================================================"
