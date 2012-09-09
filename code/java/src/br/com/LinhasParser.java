package br.com;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;

import org.apache.commons.lang.WordUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class LinhasParser {
	public static void parse() throws IOException, JSONException{
		System.out.println("Buscando JSON de todas as linhas...");
		String json = Common.getSiteAsString("http://www.poatransporte.com.br/php/facades/process.php?a=nc&p=%&t=o");
		System.out.println("OK");
		JSONArray arrayOfLinhas = new JSONArray(json);
		
		
		FileWriter fstreamLinhas = new FileWriter("linhas.csv");
		BufferedWriter writerLinhas = new BufferedWriter(fstreamLinhas);
		writerLinhas.write("linha_id,onibus_id,nome,sentido,geometria\n");
		
		for(int i = 0; i < arrayOfLinhas.length(); i++){
			JSONObject linha = arrayOfLinhas.getJSONObject(i);
			String linha_id = linha.getString("id");
			String codigo = linha.getString("codigo");
			String[] codigoSplit = codigo.split("-");
			String onibus_id = codigoSplit[0];
			String nome = WordUtils.capitalizeFully(linha.getString("nome").trim(), new char[] {' ', '/'});

			String sentido = codigoSplit[1];
		
			writerLinhas.write(linha_id + "," + onibus_id +","+nome+ ","+sentido + ",\"");
			
			System.out.print("Buscando JSON da linhas "+ linha_id +"...");
			String jsonRota = Common.getSiteAsString("http://www.poatransporte.com.br/php/facades/process.php?a=il&p="+linha_id);
			System.out.println("OK");
			JSONObject rota = new JSONObject(jsonRota);
			
			int point = 0;

			writerLinhas.write("<LineString><coordinates>");
            while(rota.has(Integer.toString(point))){
                JSONObject obj = rota.getJSONObject(Integer.toString(point));
                String lat = obj.getString("lat");
                String lng = obj.getString("lng");
                
                
                writerLinhas.write(lng + "," + lat + "\n"); //not sure why
                
                point++;
            }
            writerLinhas.write("</coordinates></LineString>\"\n");			
			
		}
		
		writerLinhas.close();
		System.out.println("Feito");
	}
}
