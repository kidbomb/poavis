package br.com;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ParadasParser {
	/**
	 * Gera os arquivos parada e parada_linha
	 * @param args
	 * @throws IOException
	 * @throws JSONException
	 */
	public static void parse() throws IOException, JSONException{
		//não passar nenhum parametro faz retornar todas as paradas
		System.out.println("Buscando JSON...");
		String result = Common.getSiteAsString("http://www.poatransporte.com.br/php/facades/process.php?a=tp&p=");
		System.out.println("OK");
		String [] lines = result.split("\\r?\\n");
		
		//as outras linhas mostram só Notices
		String json = lines[6];
		
		FileWriter fstreamParadas = new FileWriter("paradas.csv");
		BufferedWriter writerParadas = new BufferedWriter(fstreamParadas);
		writerParadas.write("parada_id,latlng,terminal\n");
		
		
		FileWriter fstreamParadaLinha = new FileWriter("parada_linha.csv");
		BufferedWriter writerParadaLinha = new BufferedWriter(fstreamParadaLinha);
		writerParadaLinha.write("parada_id,linha_id\n");
		
		JSONArray arrayOfParadas = new JSONArray(json);
		
		
		for(int i = 0; i < arrayOfParadas.length(); i++){
			
			JSONObject parada = arrayOfParadas.getJSONObject(i);
			String codigo = parada.getString("codigo");
			String latitude = parada.getString("latitude");
			String longitude = parada.getString("longitude");
			String terminal = parada.getString("terminal");
			
			System.out.println("Gravando informações da parada "+codigo);
			
			writerParadas.write(codigo+",\""+latitude+","+longitude+"\","+terminal+"\n");
			
			JSONArray arrayOfLinhas = parada.getJSONArray("linhas"); 
			for(int j = 0; j < arrayOfLinhas.length(); j++){
				JSONObject linha = arrayOfLinhas.getJSONObject(j);
				String idLinha = linha.getString("idLinha");
				String codigoLinha = linha.getString("codigoLinha");
				
				writerParadaLinha.write(codigo+","+idLinha+"\n");
			}
		}
		writerParadas.close();
		writerParadaLinha.close();
		System.out.println("Feito");
	}
}
